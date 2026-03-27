import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { UploadsService } from './uploads.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Public } from '../common/decorators/roles.decorator.js';
import { FileType } from './enums/file-type.enum.js';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('properties/:id/images')
  @ApiTags('Property Images')
  @Roles('admin', 'manager', 'agent')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload property images (multiple)' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  uploadPropertyImages(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadsService.uploadPropertyImages(propertyId, files);
  }

  @Delete('properties/:id/images/:imageId')
  @ApiTags('Property Images')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Delete a property image' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiParam({ name: 'imageId', description: 'Image UUID' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'Property or image not found' })
  deletePropertyImage(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.uploadsService.deletePropertyImage(propertyId, imageId);
  }

  @Patch('properties/:id/images/:imageId/primary')
  @ApiTags('Property Images')
  @Roles('admin', 'manager', 'agent')
  @ApiOperation({ summary: 'Set image as primary' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiParam({ name: 'imageId', description: 'Image UUID' })
  @ApiResponse({ status: 200, description: 'Primary image updated' })
  @ApiResponse({ status: 404, description: 'Property or image not found' })
  setPrimaryImage(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.uploadsService.setPrimaryImage(propertyId, imageId);
  }

  @Post('contracts/:id/documents')
  @ApiTags('Contract Documents')
  @Roles('admin', 'manager')
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload contract document' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  uploadContractDocument(
    @Param('id', ParseUUIDPipe) contractId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadContractDocument(contractId, file);
  }

  @Get('uploads/:type/:filename')
  @Public()
  @ApiTags('File Serving')
  @ApiOperation({ summary: 'Serve an uploaded file' })
  @ApiParam({ name: 'type', enum: FileType })
  @ApiParam({ name: 'filename', description: 'Filename' })
  @ApiResponse({ status: 200, description: 'File content' })
  @ApiResponse({ status: 400, description: 'Invalid file type' })
  @ApiResponse({ status: 403, description: 'Documents require authentication' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async serveFile(
    @Param('type', new ParseEnumPipe(FileType)) type: FileType,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Documents require authentication - reject unauthenticated requests
    const reqWithUser = req as Request & { user?: unknown };
    if (type === FileType.DOCUMENTS && !reqWithUser.user) {
      throw new ForbiddenException('Documents require authentication');
    }

    const filePath = await this.uploadsService.getFilePath(type, filename);
    return res.sendFile(filePath);
  }
}
