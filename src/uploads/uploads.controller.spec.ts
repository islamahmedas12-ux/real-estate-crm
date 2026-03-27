import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { FileType } from './enums/file-type.enum.js';

const mockService = {
  uploadPropertyImages: jest.fn(),
  deletePropertyImage: jest.fn(),
  setPrimaryImage: jest.fn(),
  uploadContractDocument: jest.fn(),
  getFilePath: jest.fn(),
};

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [{ provide: UploadsService, useValue: mockService }],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const propertyId = '123e4567-e89b-12d3-a456-426614174000';
  const imageId = '223e4567-e89b-12d3-a456-426614174001';
  const contractId = '323e4567-e89b-12d3-a456-426614174002';

  const mockFile: Express.Multer.File = {
    fieldname: 'images',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100,
    buffer: Buffer.from('fake-image'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  describe('uploadPropertyImages', () => {
    it('should upload images and return results', async () => {
      const uploadResult = [
        { id: imageId, propertyId, url: '/api/uploads/images/img.jpg', isPrimary: true, order: 0 },
      ];
      mockService.uploadPropertyImages.mockResolvedValue(uploadResult);

      const result = await controller.uploadPropertyImages(propertyId, [mockFile]);

      expect(result).toEqual(uploadResult);
      expect(mockService.uploadPropertyImages).toHaveBeenCalledWith(propertyId, [mockFile]);
    });

    it('should pass multiple files to service', async () => {
      mockService.uploadPropertyImages.mockResolvedValue([{ id: 'img-1' }, { id: 'img-2' }]);

      const files = [mockFile, { ...mockFile, originalname: 'photo2.jpg' }];
      const result = await controller.uploadPropertyImages(propertyId, files);

      expect(result).toHaveLength(2);
      expect(mockService.uploadPropertyImages).toHaveBeenCalledWith(propertyId, files);
    });
  });

  describe('deletePropertyImage', () => {
    it('should delete an image', async () => {
      mockService.deletePropertyImage.mockResolvedValue({ message: 'Image deleted successfully' });

      const result = await controller.deletePropertyImage(propertyId, imageId);

      expect(result).toEqual({ message: 'Image deleted successfully' });
      expect(mockService.deletePropertyImage).toHaveBeenCalledWith(propertyId, imageId);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.deletePropertyImage.mockRejectedValue(new NotFoundException('Image not found'));

      await expect(controller.deletePropertyImage(propertyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setPrimaryImage', () => {
    it('should set primary image', async () => {
      mockService.setPrimaryImage.mockResolvedValue({ message: 'Primary image updated' });

      const result = await controller.setPrimaryImage(propertyId, imageId);

      expect(result).toEqual({ message: 'Primary image updated' });
      expect(mockService.setPrimaryImage).toHaveBeenCalledWith(propertyId, imageId);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.setPrimaryImage.mockRejectedValue(new NotFoundException('Image not found'));

      await expect(controller.setPrimaryImage(propertyId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadContractDocument', () => {
    it('should upload a contract document', async () => {
      const docResult = { documentUrl: '/api/uploads/documents/contract.pdf' };
      mockService.uploadContractDocument.mockResolvedValue(docResult);

      const docFile = { ...mockFile, mimetype: 'application/pdf', originalname: 'contract.pdf' };
      const result = await controller.uploadContractDocument(
        contractId,
        docFile as Express.Multer.File,
      );

      expect(result).toEqual(docResult);
      expect(mockService.uploadContractDocument).toHaveBeenCalledWith(contractId, docFile);
    });

    it('should propagate NotFoundException when contract not found', async () => {
      mockService.uploadContractDocument.mockRejectedValue(
        new NotFoundException('Contract not found'),
      );

      await expect(controller.uploadContractDocument('nonexistent', mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('serveFile', () => {
    const mockResponse = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.sendFile = jest.fn().mockReturnValue(res);
      return res;
    };

    const mockRequest = (user?: any) => ({ user }) as any;

    it('should serve an image file without authentication', async () => {
      const res = mockResponse();
      const req = mockRequest(); // no user
      mockService.getFilePath.mockResolvedValue('/tmp/uploads/images/photo.jpg');

      await controller.serveFile(FileType.IMAGES, 'photo.jpg', req, res);

      expect(mockService.getFilePath).toHaveBeenCalledWith(FileType.IMAGES, 'photo.jpg');
      expect(res.sendFile).toHaveBeenCalledWith('/tmp/uploads/images/photo.jpg');
    });

    it('should serve a thumbnail file without authentication', async () => {
      const res = mockResponse();
      const req = mockRequest(); // no user
      mockService.getFilePath.mockResolvedValue('/tmp/uploads/thumbnails/thumb.jpg');

      await controller.serveFile(FileType.THUMBNAILS, 'thumb.jpg', req, res);

      expect(mockService.getFilePath).toHaveBeenCalledWith(FileType.THUMBNAILS, 'thumb.jpg');
      expect(res.sendFile).toHaveBeenCalledWith('/tmp/uploads/thumbnails/thumb.jpg');
    });

    it('should serve a document file for authenticated users', async () => {
      const res = mockResponse();
      const req = mockRequest({ id: 'user-1', role: 'admin' });
      mockService.getFilePath.mockResolvedValue('/tmp/uploads/documents/doc.pdf');

      await controller.serveFile(FileType.DOCUMENTS, 'doc.pdf', req, res);

      expect(mockService.getFilePath).toHaveBeenCalledWith(FileType.DOCUMENTS, 'doc.pdf');
      expect(res.sendFile).toHaveBeenCalledWith('/tmp/uploads/documents/doc.pdf');
    });

    it('should throw ForbiddenException for unauthenticated document access', async () => {
      const res = mockResponse();
      const req = mockRequest(); // no user

      await expect(controller.serveFile(FileType.DOCUMENTS, 'doc.pdf', req, res)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockService.getFilePath).not.toHaveBeenCalled();
    });
  });
});
