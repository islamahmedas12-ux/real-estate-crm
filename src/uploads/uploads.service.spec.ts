import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Mock fs and sharp
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({}),
  }));
  return { __esModule: true, default: mockSharp };
});

import * as fs from 'fs';

const mockPrisma = {
  property: {
    findUnique: jest.fn(),
  },
  propertyImage: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  contract: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockConfig = {
  get: jest.fn().mockReturnValue('/tmp/test-uploads'),
};

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    jest.clearAllMocks();
    // Re-stub existsSync after clearAllMocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  const propertyId = '123e4567-e89b-12d3-a456-426614174000';
  const imageId = '223e4567-e89b-12d3-a456-426614174001';
  const contractId = '323e4567-e89b-12d3-a456-426614174002';

  const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'images',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100, // 100KB
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
  });

  describe('uploadPropertyImages', () => {
    beforeEach(() => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: propertyId });
    });

    it('should upload images successfully and set first as primary', async () => {
      mockPrisma.propertyImage.count.mockResolvedValue(0);
      mockPrisma.propertyImage.create.mockResolvedValue({
        id: imageId,
        propertyId,
        url: '/api/uploads/images/test.jpg',
        isPrimary: true,
        order: 0,
      });

      const files = [mockFile()];
      const result = await service.uploadPropertyImages(propertyId, files);

      expect(result).toHaveLength(1);
      expect(mockPrisma.propertyImage.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.propertyImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId,
            isPrimary: true,
            order: 0,
          }),
        }),
      );
    });

    it('should not set subsequent images as primary when images already exist', async () => {
      mockPrisma.propertyImage.count.mockResolvedValue(3);
      mockPrisma.propertyImage.create.mockResolvedValue({
        id: imageId,
        propertyId,
        url: '/api/uploads/images/test.jpg',
        isPrimary: false,
        order: 3,
      });

      const files = [mockFile()];
      const result = await service.uploadPropertyImages(propertyId, files);

      expect(result).toHaveLength(1);
      expect(mockPrisma.propertyImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPrimary: false,
            order: 3,
          }),
        }),
      );
    });

    it('should throw BadRequestException when no files provided', async () => {
      await expect(
        service.uploadPropertyImages(propertyId, []),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadPropertyImages(propertyId, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = mockFile({
        mimetype: 'application/pdf',
        originalname: 'doc.pdf',
      });

      await expect(
        service.uploadPropertyImages(propertyId, [invalidFile]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadPropertyImages(propertyId, [invalidFile]),
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw BadRequestException for oversized file', async () => {
      const largeFile = mockFile({
        size: 11 * 1024 * 1024, // 11MB
      });

      await expect(
        service.uploadPropertyImages(propertyId, [largeFile]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadPropertyImages(propertyId, [largeFile]),
      ).rejects.toThrow('File too large');
    });

    it('should throw NotFoundException when property does not exist', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadPropertyImages('nonexistent', [mockFile()]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle multiple file uploads', async () => {
      mockPrisma.propertyImage.count.mockResolvedValue(0);
      mockPrisma.propertyImage.create
        .mockResolvedValueOnce({ id: 'img-1', isPrimary: true, order: 0 })
        .mockResolvedValueOnce({ id: 'img-2', isPrimary: false, order: 1 });

      const files = [mockFile(), mockFile({ originalname: 'photo2.png', mimetype: 'image/png' })];
      const result = await service.uploadPropertyImages(propertyId, files);

      expect(result).toHaveLength(2);
      expect(mockPrisma.propertyImage.create).toHaveBeenCalledTimes(2);
    });

    it('should accept webp images', async () => {
      mockPrisma.propertyImage.count.mockResolvedValue(0);
      mockPrisma.propertyImage.create.mockResolvedValue({ id: imageId });

      const webpFile = mockFile({ mimetype: 'image/webp', originalname: 'photo.webp' });
      const result = await service.uploadPropertyImages(propertyId, [webpFile]);

      expect(result).toHaveLength(1);
    });
  });

  describe('deletePropertyImage', () => {
    beforeEach(() => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: propertyId });
    });

    it('should delete an image and its files from disk', async () => {
      mockPrisma.propertyImage.findFirst.mockResolvedValue({
        id: imageId,
        propertyId,
        url: '/api/uploads/images/test-image.jpg',
        isPrimary: false,
      });
      mockPrisma.propertyImage.delete.mockResolvedValue({});

      const result = await service.deletePropertyImage(propertyId, imageId);

      expect(result).toEqual({ message: 'Image deleted successfully' });
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2); // image + thumbnail
      expect(mockPrisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: imageId },
      });
    });

    it('should promote next image to primary when deleting primary image', async () => {
      mockPrisma.propertyImage.findFirst
        .mockResolvedValueOnce({
          id: imageId,
          propertyId,
          url: '/api/uploads/images/primary.jpg',
          isPrimary: true,
        })
        .mockResolvedValueOnce({
          id: 'next-image-id',
          propertyId,
          order: 1,
        });
      mockPrisma.propertyImage.delete.mockResolvedValue({});
      mockPrisma.propertyImage.update.mockResolvedValue({});

      await service.deletePropertyImage(propertyId, imageId);

      expect(mockPrisma.propertyImage.update).toHaveBeenCalledWith({
        where: { id: 'next-image-id' },
        data: { isPrimary: true },
      });
    });

    it('should not promote when deleting the only primary image', async () => {
      mockPrisma.propertyImage.findFirst
        .mockResolvedValueOnce({
          id: imageId,
          propertyId,
          url: '/api/uploads/images/only.jpg',
          isPrimary: true,
        })
        .mockResolvedValueOnce(null); // no next image
      mockPrisma.propertyImage.delete.mockResolvedValue({});

      await service.deletePropertyImage(propertyId, imageId);

      expect(mockPrisma.propertyImage.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when image does not exist', async () => {
      mockPrisma.propertyImage.findFirst.mockResolvedValue(null);

      await expect(
        service.deletePropertyImage(propertyId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle missing files on disk gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPrisma.propertyImage.findFirst.mockResolvedValue({
        id: imageId,
        propertyId,
        url: '/api/uploads/images/missing.jpg',
        isPrimary: false,
      });
      mockPrisma.propertyImage.delete.mockResolvedValue({});

      const result = await service.deletePropertyImage(propertyId, imageId);

      expect(result).toEqual({ message: 'Image deleted successfully' });
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when property does not exist', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.deletePropertyImage('nonexistent', imageId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPrimaryImage', () => {
    beforeEach(() => {
      mockPrisma.property.findUnique.mockResolvedValue({ id: propertyId });
    });

    it('should set a new primary image', async () => {
      mockPrisma.propertyImage.findFirst.mockResolvedValue({
        id: imageId,
        propertyId,
      });
      mockPrisma.propertyImage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.propertyImage.update.mockResolvedValue({});

      const result = await service.setPrimaryImage(propertyId, imageId);

      expect(result).toEqual({ message: 'Primary image updated' });
      expect(mockPrisma.propertyImage.updateMany).toHaveBeenCalledWith({
        where: { propertyId, isPrimary: true },
        data: { isPrimary: false },
      });
      expect(mockPrisma.propertyImage.update).toHaveBeenCalledWith({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });

    it('should throw NotFoundException when image does not exist', async () => {
      mockPrisma.propertyImage.findFirst.mockResolvedValue(null);

      await expect(
        service.setPrimaryImage(propertyId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when property does not exist', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.setPrimaryImage('nonexistent', imageId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadContractDocument', () => {
    it('should upload a PDF document', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: contractId });
      mockPrisma.contract.update.mockResolvedValue({
        id: contractId,
        documentUrl: '/api/uploads/documents/test.pdf',
      });

      const file = mockFile({
        mimetype: 'application/pdf',
        originalname: 'contract.pdf',
      });

      const result = await service.uploadContractDocument(contractId, file);

      expect(result).toHaveProperty('documentUrl');
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockPrisma.contract.update).toHaveBeenCalledTimes(1);
    });

    it('should upload a DOCX document', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: contractId });
      mockPrisma.contract.update.mockResolvedValue({
        id: contractId,
        documentUrl: '/api/uploads/documents/test.docx',
      });

      const file = mockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'contract.docx',
      });

      const result = await service.uploadContractDocument(contractId, file);

      expect(result).toHaveProperty('documentUrl');
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue(null);

      const file = mockFile({ mimetype: 'application/pdf', originalname: 'doc.pdf' });

      await expect(
        service.uploadContractDocument('nonexistent', file),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: contractId });

      const file = mockFile({
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      });

      await expect(
        service.uploadContractDocument(contractId, file),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadContractDocument(contractId, file),
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw BadRequestException for oversized document', async () => {
      mockPrisma.contract.findUnique.mockResolvedValue({ id: contractId });

      const file = mockFile({
        mimetype: 'application/pdf',
        originalname: 'huge.pdf',
        size: 26 * 1024 * 1024, // 26MB
      });

      await expect(
        service.uploadContractDocument(contractId, file),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadContractDocument(contractId, file),
      ).rejects.toThrow('File too large');
    });
  });

  describe('getFilePath', () => {
    it('should return the file path for an existing file', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.getFilePath('images', 'test-image.jpg');

      expect(result).toContain('images');
      expect(result).toContain('test-image.jpg');
    });

    it('should throw NotFoundException for missing file', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => service.getFilePath('images', 'nonexistent.jpg')).toThrow(
        NotFoundException,
      );
    });

    it('should sanitize path traversal attempts', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.getFilePath('images', '../../../etc/passwd');

      // path.basename strips directory traversal
      expect(result).not.toContain('..');
      expect(result).toContain('passwd');
    });

    it('should work for thumbnails type', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.getFilePath('thumbnails', 'thumb.jpg');

      expect(result).toContain('thumbnails');
    });

    it('should work for documents type', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.getFilePath('documents', 'contract.pdf');

      expect(result).toContain('documents');
    });
  });
});
