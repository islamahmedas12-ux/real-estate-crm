import { Injectable } from '@nestjs/common';
import { PdfBaseTemplate } from '../pdf-base.template.js';
import type { Invoice, Contract, Property, Client } from '@prisma/client';

type InvoiceWithRelations = Invoice & {
  contract: Contract & {
    property: Property;
    client: Client;
  };
};

@Injectable()
export class InvoicePdfTemplate extends PdfBaseTemplate {
  async generate(invoice: InvoiceWithRelations): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(doc, 'INVOICE / فاتورة');

    const { contract } = invoice;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Invoice metadata (two-column layout)
    const leftX = doc.page.margins.left;
    const rightX = doc.page.margins.left + pageWidth / 2;
    let y = doc.y;

    doc.fontSize(10).fillColor('#718096').text('Invoice Number:', leftX, y);
    doc.fillColor(this.textColor).text(invoice.invoiceNumber, leftX + 100, y);

    doc.fillColor('#718096').text('Status:', rightX, y);
    doc.fillColor(this.statusColor(invoice.status)).text(invoice.status, rightX + 100, y);

    y += 18;
    doc.fillColor('#718096').text('Issue Date:', leftX, y);
    doc.fillColor(this.textColor).text(this.formatDate(invoice.createdAt), leftX + 100, y);

    doc.fillColor('#718096').text('Due Date:', rightX, y);
    doc.fillColor(this.textColor).text(this.formatDate(invoice.dueDate), rightX + 100, y);

    if (invoice.paidDate) {
      y += 18;
      doc.fillColor('#718096').text('Paid Date:', leftX, y);
      doc.fillColor(this.textColor).text(this.formatDate(invoice.paidDate), leftX + 100, y);

      if (invoice.paymentMethod) {
        doc.fillColor('#718096').text('Payment Method:', rightX, y);
        doc.fillColor(this.textColor).text(invoice.paymentMethod, rightX + 100, y);
      }
    }

    doc.y = y + 30;

    // Bill To
    this.addSection(doc, 'Bill To');
    this.addLabelValue(doc, 'Name:', `${contract.client.firstName} ${contract.client.lastName}`);
    if (contract.client.email) {
      this.addLabelValue(doc, 'Email:', contract.client.email);
    }
    this.addLabelValue(doc, 'Phone:', contract.client.phone);
    doc.moveDown(1);

    // Property reference
    this.addSection(doc, 'Property Reference');
    this.addLabelValue(doc, 'Property:', contract.property.title);
    this.addLabelValue(doc, 'Address:', `${contract.property.address}, ${contract.property.city}`);
    this.addLabelValue(doc, 'Contract Type:', contract.type);
    doc.moveDown(1);

    // Amount table
    this.addSection(doc, 'Amount Details');
    this.addTable(
      doc,
      ['Description', 'Contract Total', 'Invoice Amount'],
      [
        [
          `${contract.type} — ${contract.property.title}`,
          this.formatCurrency(contract.totalAmount.toString()),
          this.formatCurrency(invoice.amount.toString()),
        ],
      ],
      [230, 130, 130],
    );

    // Total box
    doc.moveDown(0.5);
    const totalBoxX = doc.page.margins.left + pageWidth - 200;
    const totalBoxY = doc.y;
    doc
      .rect(totalBoxX, totalBoxY, 200, 35)
      .fill(this.primaryColor);
    doc
      .fontSize(12)
      .fillColor('#ffffff')
      .text('TOTAL DUE', totalBoxX + 10, totalBoxY + 10, { continued: true })
      .text(`  ${this.formatCurrency(invoice.amount.toString())}`, { align: 'right' });

    doc.y = totalBoxY + 50;

    // Notes
    if (invoice.notes) {
      this.addSection(doc, 'Notes');
      doc.fontSize(10).fillColor(this.textColor).text(invoice.notes);
    }

    this.addFooter(doc);
    return this.streamToBuffer(doc);
  }

  private statusColor(status: string): string {
    switch (status) {
      case 'PAID':
        return '#38a169';
      case 'OVERDUE':
        return '#e53e3e';
      case 'CANCELLED':
        return '#a0aec0';
      default:
        return '#dd6b20';
    }
  }
}
