import PDFDocument from 'pdfkit';

export interface CompanyInfo {
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoPath?: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Real Estate CRM',
  nameAr: 'إدارة العقارات',
  address: 'Cairo, Egypt',
  phone: '+20 2 xxxx xxxx',
  email: 'info@realestate-crm.com',
};

export abstract class PdfBaseTemplate {
  protected primaryColor = '#1a365d';
  protected accentColor = '#2b6cb0';
  protected lightGray = '#f7fafc';
  protected borderColor = '#e2e8f0';
  protected textColor = '#2d3748';

  protected createDocument(): typeof PDFDocument.prototype {
    return new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });
  }

  protected addHeader(
    doc: typeof PDFDocument.prototype,
    title: string,
    company: CompanyInfo = DEFAULT_COMPANY,
  ): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Company name
    doc
      .fontSize(18)
      .fillColor(this.primaryColor)
      .text(company.name, { align: 'center' });

    if (company.nameAr) {
      doc
        .fontSize(14)
        .fillColor(this.accentColor)
        .text(company.nameAr, { align: 'center' });
    }

    doc.moveDown(0.3);

    // Contact info
    if (company.address || company.phone || company.email) {
      const parts: string[] = [];
      if (company.address) parts.push(company.address);
      if (company.phone) parts.push(company.phone);
      if (company.email) parts.push(company.email);
      doc
        .fontSize(8)
        .fillColor('#718096')
        .text(parts.join('  |  '), { align: 'center' });
    }

    doc.moveDown(0.5);

    // Divider line
    const y = doc.y;
    doc
      .strokeColor(this.primaryColor)
      .lineWidth(2)
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .stroke();

    doc.moveDown(0.5);

    // Document title
    doc
      .fontSize(16)
      .fillColor(this.primaryColor)
      .text(title, { align: 'center' });

    doc.moveDown(1);
  }

  protected addFooter(doc: typeof PDFDocument.prototype): void {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const pageWidth = doc.page.width;
      doc
        .fontSize(8)
        .fillColor('#a0aec0')
        .text(
          `Page ${i + 1} of ${pages.count}`,
          doc.page.margins.left,
          doc.page.height - 35,
          { align: 'center', width: pageWidth - doc.page.margins.left - doc.page.margins.right },
        );
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-GB')}`,
        doc.page.margins.left,
        doc.page.height - 25,
        { align: 'center', width: pageWidth - doc.page.margins.left - doc.page.margins.right },
      );
    }
  }

  protected addSection(
    doc: typeof PDFDocument.prototype,
    title: string,
  ): void {
    doc
      .fontSize(12)
      .fillColor(this.primaryColor)
      .text(title, { underline: true });
    doc.moveDown(0.5);
  }

  protected addLabelValue(
    doc: typeof PDFDocument.prototype,
    label: string,
    value: string,
  ): void {
    doc
      .fontSize(10)
      .fillColor('#718096')
      .text(label, { continued: true })
      .fillColor(this.textColor)
      .text(`  ${value}`);
  }

  protected addTable(
    doc: typeof PDFDocument.prototype,
    headers: string[],
    rows: string[][],
    colWidths?: number[],
  ): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cols = headers.length;
    const widths = colWidths ?? headers.map(() => pageWidth / cols);
    const rowHeight = 25;
    const startX = doc.page.margins.left;
    let y = doc.y;

    // Header row
    doc
      .rect(startX, y, pageWidth, rowHeight)
      .fill(this.primaryColor);

    let x = startX;
    headers.forEach((h, i) => {
      doc
        .fontSize(9)
        .fillColor('#ffffff')
        .text(h, x + 5, y + 7, { width: widths[i] - 10, align: 'left' });
      x += widths[i];
    });

    y += rowHeight;

    // Data rows
    rows.forEach((row, rowIdx) => {
      // Check for page break
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      const bgColor = rowIdx % 2 === 0 ? this.lightGray : '#ffffff';
      doc
        .rect(startX, y, pageWidth, rowHeight)
        .fill(bgColor);

      x = startX;
      row.forEach((cell, i) => {
        doc
          .fontSize(9)
          .fillColor(this.textColor)
          .text(cell, x + 5, y + 7, { width: widths[i] - 10, align: 'left' });
        x += widths[i];
      });

      y += rowHeight;
    });

    // Bottom border
    doc
      .strokeColor(this.borderColor)
      .lineWidth(1)
      .moveTo(startX, y)
      .lineTo(startX + pageWidth, y)
      .stroke();

    doc.y = y + 10;
  }

  protected formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `EGP ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected streamToBuffer(doc: typeof PDFDocument.prototype): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
