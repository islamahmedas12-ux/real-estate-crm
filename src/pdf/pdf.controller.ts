import { Controller, Get, Post, Param, Body, Res, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from './pdf.service.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@ApiTags('PDF Generation')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('contracts/:id/pdf')
  @ApiOperation({ summary: 'Download contract as PDF' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async contractPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    await this.pdfService.streamContractPdf(id, res);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async invoicePdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    await this.pdfService.streamInvoicePdf(id, res);
  }

  @Get('properties/:id/pdf')
  @ApiOperation({ summary: 'Download property listing as PDF' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async propertyPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    await this.pdfService.streamPropertyPdf(id, res);
  }

  @Post('reports/generate-pdf')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate a report PDF (monthly revenue or agent performance)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  async generateReport(@Body() dto: GenerateReportDto, @Res() res: Response) {
    const filename = `report-${dto.type}-${dto.month ?? 'current'}.pdf`;
    await this.pdfService.streamReport(dto.type, dto.month, dto.agentId, res, filename);
  }
}
