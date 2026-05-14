import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service.js';
import { LocalDiskProvider } from './providers/local-disk.provider.js';
import { S3Provider } from './providers/s3.provider.js';
import type { StorageProvider } from './interfaces/storage-provider.interface.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 200;

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;
  private readonly storageProvider: StorageProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const storageDriver = this.config.get<string>('STORAGE_DRIVER') || 'local';

    if (storageDriver === 's3') {
      const bucket = this.config.get<string>('S3_BUCKET')!;
      const region = this.config.get<string>('S3_REGION') || 'us-east-1';
      const accessKeyId = this.config.get<string>('S3_ACCESS_KEY')!;
      const secretAccessKey = this.config.get<string>('S3_SECRET_KEY')!;
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      this.storageProvider = new S3Provider(bucket, region, accessKeyId, secretAccessKey, endpoint);
    } else {
      this.uploadDir = this.config.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
      this.storageProvider = new LocalDiskProvider(this.uploadDir);
      this.ensureDirectories();
    }
  }

  private ensureDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'thumbnails'),
      path.join(this.uploadDir, 'documents'),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async uploadPropertyImages(propertyId: string, files: Express.Multer.File[]) {
    await this.ensurePropertyExists(propertyId);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.originalname}. Allowed: jpg, png, webp`,
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException(`File too large: ${file.originalname}. Max 10MB`);
      }
    }

    const existingCount = await this.prisma.propertyImage.count({
      where: { propertyId },
    });

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = `${propertyId}-${Date.now()}-${i}${path.extname(file.originalname)}`;

      const mainBuffer = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      const thumbBuffer = await sharp(file.buffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
        .toBuffer();

      await this.storageProvider.upload(`images/${filename}`, mainBuffer, file.mimetype);
      await this.storageProvider.upload(`thumbnails/${filename}`, thumbBuffer, file.mimetype);

      const image = await this.prisma.propertyImage.create({
        data: {
          propertyId,
          url: filename,
          isPrimary: existingCount === 0 && i === 0,
          order: existingCount + i,
        },
      });

      results.push(image);
    }

    return results;
  }

  async deletePropertyImage(propertyId: string, imageId: string) {
    await this.ensurePropertyExists(propertyId);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const filename = image.url;

    await this.storageProvider.delete(`images/${filename}`);
    await this.storageProvider.delete(`thumbnails/${filename}`);

    await this.prisma.propertyImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextImage = await this.prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { order: 'asc' },
      });
      if (nextImage) {
        await this.prisma.propertyImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Image deleted successfully' };
  }

  async setPrimaryImage(propertyId: string, imageId: string) {
    await this.ensurePropertyExists(propertyId);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.$transaction([
      this.prisma.propertyImage.updateMany({
        where: { propertyId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.propertyImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return { message: 'Primary image updated' };
  }

  async uploadContractDocument(contractId: string, file: Express.Multer.File) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID "${contractId}" not found`);
    }

    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: pdf, docx');
    }

    if (file.size > MAX_DOC_SIZE) {
      throw new BadRequestException('File too large. Max 25MB');
    }

    const filename = `${contractId}-${Date.now()}${path.extname(file.originalname)}`;

    await this.storageProvider.upload(`documents/${filename}`, file.buffer, file.mimetype);

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: { documentUrl: filename },
    });

    return { documentUrl: updated.documentUrl };
  }

  async getFilePath(
    type: 'images' | 'thumbnails' | 'documents',
    filename: string,
  ): Promise<string> {
    const sanitized = path.basename(filename);

    if (this.storageProvider instanceof LocalDiskProvider) {
      const filePath = path.join(this.uploadDir, type, sanitized);
      try {
        await fsPromises.access(filePath);
      } catch {
        throw new NotFoundException('File not found');
      }
      return filePath;
    }

    const url = await this.storageProvider.getSignedUrl(`${type}/${sanitized}`, 3600);
    return url;
  }

  private async ensurePropertyExists(propertyId: string) {
    const exists = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found`);
    }
  }
}