import { Injectable } from '@nestjs/common';
import { PdfBaseTemplate } from '../pdf-base.template.js';
import type { Contract, Property, Client } from '@prisma/client';

type ContractWithRelations = Contract & {
  property: Property;
  client: Client;
};

@Injectable()
export class ContractPdfTemplate extends PdfBaseTemplate {
  async generate(contract: ContractWithRelations): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(doc, 'CONTRACT / عقد');

    // Contract info
    this.addSection(doc, 'Contract Details');
    this.addLabelValue(doc, 'Contract ID:', contract.id);
    this.addLabelValue(doc, 'Type:', contract.type);
    this.addLabelValue(doc, 'Status:', contract.status);
    this.addLabelValue(doc, 'Start Date:', this.formatDate(contract.startDate));
    if (contract.endDate) {
      this.addLabelValue(doc, 'End Date:', this.formatDate(contract.endDate));
    }
    this.addLabelValue(doc, 'Total Amount:', this.formatCurrency(contract.totalAmount.toString()));
    doc.moveDown(1);

    // Property info
    this.addSection(doc, 'Property Details');
    this.addLabelValue(doc, 'Title:', contract.property.title);
    this.addLabelValue(doc, 'Type:', contract.property.type);
    this.addLabelValue(doc, 'Address:', contract.property.address);
    this.addLabelValue(
      doc,
      'City / Region:',
      `${contract.property.city}, ${contract.property.region}`,
    );
    this.addLabelValue(doc, 'Area:', `${contract.property.area} sqm`);
    if (contract.property.bedrooms != null) {
      this.addLabelValue(doc, 'Bedrooms:', String(contract.property.bedrooms));
    }
    if (contract.property.bathrooms != null) {
      this.addLabelValue(doc, 'Bathrooms:', String(contract.property.bathrooms));
    }
    doc.moveDown(1);

    // Client (party) info
    this.addSection(doc, 'Client / Party');
    this.addLabelValue(doc, 'Name:', `${contract.client.firstName} ${contract.client.lastName}`);
    if (contract.client.email) {
      this.addLabelValue(doc, 'Email:', contract.client.email);
    }
    this.addLabelValue(doc, 'Phone:', contract.client.phone);
    if (contract.client.nationalId) {
      this.addLabelValue(doc, 'National ID:', contract.client.nationalId);
    }
    doc.moveDown(1);

    // Payment terms
    if (contract.paymentTerms) {
      this.addSection(doc, 'Payment Terms');
      const terms = contract.paymentTerms as Record<string, unknown>;
      if (terms.installments && Array.isArray(terms.installments)) {
        const rows = (
          terms.installments as Array<{ amount?: number; dueDate?: string; description?: string }>
        ).map((inst, i) => [
          String(i + 1),
          inst.description ?? `Installment ${i + 1}`,
          inst.dueDate ? this.formatDate(inst.dueDate) : '-',
          inst.amount ? this.formatCurrency(inst.amount) : '-',
        ]);
        this.addTable(doc, ['#', 'Description', 'Due Date', 'Amount'], rows, [30, 200, 130, 130]);
      } else {
        doc
          .fontSize(10)
          .fillColor(this.textColor)
          .text(JSON.stringify(terms, null, 2));
      }
      doc.moveDown(1);
    }

    // Notes
    if (contract.notes) {
      this.addSection(doc, 'Notes');
      doc.fontSize(10).fillColor(this.textColor).text(contract.notes);
      doc.moveDown(1);
    }

    // Signature area
    doc.moveDown(2);
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const halfWidth = pageWidth / 2;
    const sigY = doc.y;

    doc
      .fontSize(10)
      .fillColor(this.textColor)
      .text('Company Representative', doc.page.margins.left, sigY, {
        width: halfWidth,
        align: 'center',
      });

    doc.text('Client Signature', doc.page.margins.left + halfWidth, sigY, {
      width: halfWidth,
      align: 'center',
    });

    const lineY = sigY + 40;
    doc
      .strokeColor(this.borderColor)
      .lineWidth(1)
      .moveTo(doc.page.margins.left + 30, lineY)
      .lineTo(doc.page.margins.left + halfWidth - 30, lineY)
      .stroke();

    doc
      .moveTo(doc.page.margins.left + halfWidth + 30, lineY)
      .lineTo(doc.page.margins.left + pageWidth - 30, lineY)
      .stroke();

    this.addFooter(doc);
    return this.streamToBuffer(doc);
  }
}
