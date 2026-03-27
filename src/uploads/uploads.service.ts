import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service.js';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    this.ensureDirectories();
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

  async uploadPropertyImages(
    propertyId: string,
    files: Express.Multer.File[],
  ) {
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
        throw new BadRequestException(
          `File too large: ${file.originalname}. Max 10MB`,
        );
      }
    }

    // Check if property already has images (for isPrimary logic)
    const existingCount = await this.prisma.propertyImage.count({
      where: { propertyId },
    });

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = `${propertyId}-${Date.now()}-${i}${path.extname(file.originalname)}`;

      // Process and save main image
      await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFile(path.join(this.uploadDir, 'images', filename));

      // Generate thumbnail
      await sharp(file.buffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
        .toFile(path.join(this.uploadDir, 'thumbnails', filename));

      const image = await this.prisma.propertyImage.create({
        data: {
          propertyId,
          url: `/api/uploads/images/${filename}`,
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

    // Extract filename from URL
    const filename = path.basename(image.url);

    // Delete files from disk
    const imagePath = path.join(this.uploadDir, 'images', filename);
    const thumbPath = path.join(this.uploadDir, 'thumbnails', filename);

    await fsPromises.unlink(imagePath).catch(() => {});
    await fsPromises.unlink(thumbPath).catch(() => {});

    await this.prisma.propertyImage.delete({ where: { id: imageId } });

    // If deleted image was primary, set the next one as primary
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

    // Use transaction to ensure atomicity - prevents race conditions
    // where concurrent calls could leave zero or multiple primaries
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

  async uploadContractDocument(
    contractId: string,
    file: Express.Multer.File,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID "${contractId}" not found`);
    }

    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: pdf, docx',
      );
    }

    if (file.size > MAX_DOC_SIZE) {
      throw new BadRequestException('File too large. Max 25MB');
    }

    const filename = `${contractId}-${Date.now()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadDir, 'documents', filename);

    await fsPromises.writeFile(filePath, file.buffer);

    // Update contract with document URL
    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: { documentUrl: `/api/uploads/documents/${filename}` },
    });

    return { documentUrl: updated.documentUrl };
  }

  async getFilePath(type: 'images' | 'thumbnails' | 'documents', filename: string): Promise<string> {
    // Prevent path traversal
    const sanitized = path.basename(filename);
    const filePath = path.join(this.uploadDir, type, sanitized);

    try {
      await fsPromises.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }

    return filePath;
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
