import { Injectable } from '@nestjs/common';
import { PdfBaseTemplate } from '../pdf-base.template.js';
import type { Property, PropertyImage } from '@prisma/client';

type PropertyWithImages = Property & {
  images: PropertyImage[];
};

@Injectable()
export class PropertyPdfTemplate extends PdfBaseTemplate {
  async generate(property: PropertyWithImages): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(doc, 'PROPERTY LISTING / عقار');

    // Title and price
    doc.fontSize(14).fillColor(this.primaryColor).text(property.title, { align: 'center' });
    doc
      .fontSize(16)
      .fillColor(this.accentColor)
      .text(this.formatCurrency(property.price.toString()), { align: 'center' });
    doc.moveDown(1);

    // Property details
    this.addSection(doc, 'Property Details');
    this.addLabelValue(doc, 'Type:', property.type);
    this.addLabelValue(doc, 'Status:', property.status);
    this.addLabelValue(doc, 'Area:', `${property.area} sqm`);
    if (property.bedrooms != null) {
      this.addLabelValue(doc, 'Bedrooms:', String(property.bedrooms));
    }
    if (property.bathrooms != null) {
      this.addLabelValue(doc, 'Bathrooms:', String(property.bathrooms));
    }
    if (property.floor != null) {
      this.addLabelValue(doc, 'Floor:', String(property.floor));
    }
    doc.moveDown(1);

    // Location
    this.addSection(doc, 'Location');
    this.addLabelValue(doc, 'Address:', property.address);
    this.addLabelValue(doc, 'City:', property.city);
    this.addLabelValue(doc, 'Region:', property.region);
    doc.moveDown(1);

    // Features
    if (property.features) {
      this.addSection(doc, 'Features');
      const features = property.features as Record<string, unknown>;
      if (Array.isArray(features)) {
        features.forEach((f) => {
          doc
            .fontSize(10)
            .fillColor(this.textColor)
            .text(`• ${String(f)}`);
        });
      } else {
        Object.entries(features).forEach(([key, val]) => {
          this.addLabelValue(doc, `${key}:`, String(val));
        });
      }
      doc.moveDown(1);
    }

    // Description
    if (property.description) {
      this.addSection(doc, 'Description');
      doc.fontSize(10).fillColor(this.textColor).text(property.description);
      doc.moveDown(1);
    }

    // Images list (URLs — actual image embedding would require fetching)
    if (property.images.length > 0) {
      this.addSection(doc, 'Photos');
      doc
        .fontSize(9)
        .fillColor('#718096')
        .text(`${property.images.length} photo(s) available. View online for full gallery.`);
      property.images.forEach((img, i) => {
        doc
          .fontSize(8)
          .fillColor(this.accentColor)
          .text(`${i + 1}. ${img.caption ?? 'Photo'} — ${img.url}`);
      });
    }

    this.addFooter(doc);
    return this.streamToBuffer(doc);
  }
}
