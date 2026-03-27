import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PdfService } from './pdf.service.js';
import { PdfController } from './pdf.controller.js';
import { ContractPdfTemplate } from './templates/contract.template.js';
import { InvoicePdfTemplate } from './templates/invoice.template.js';
import { ReportPdfTemplate } from './templates/report.template.js';
import { PropertyPdfTemplate } from './templates/property.template.js';

@Module({
  imports: [PrismaModule],
  controllers: [PdfController],
  providers: [
    PdfService,
    ContractPdfTemplate,
    InvoicePdfTemplate,
    ReportPdfTemplate,
    PropertyPdfTemplate,
  ],
  exports: [PdfService],
})
export class PdfModule {}
