import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
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
  async contractPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generateContractPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contract-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async invoicePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('properties/:id/pdf')
  @ApiOperation({ summary: 'Download property listing as PDF' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async propertyPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generatePropertyPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="property-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('reports/generate-pdf')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate a report PDF (monthly revenue or agent performance)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generateReport(
      dto.type,
      dto.month,
      dto.agentId,
    );
    const filename = `report-${dto.type}-${dto.month ?? 'current'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
