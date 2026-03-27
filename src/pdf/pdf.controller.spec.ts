import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { ReportType } from './dto/generate-report.dto';

const mockPdfBuffer = Buffer.from('%PDF-1.4 mock');

const mockService = {
  generateContractPdf: jest.fn().mockResolvedValue(mockPdfBuffer),
  generateInvoicePdf: jest.fn().mockResolvedValue(mockPdfBuffer),
  generatePropertyPdf: jest.fn().mockResolvedValue(mockPdfBuffer),
  generateReport: jest.fn().mockResolvedValue(mockPdfBuffer),
};

const mockResponse = () => {
  const res: any = {};
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('PdfController', () => {
  let controller: PdfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfController],
      providers: [{ provide: PdfService, useValue: mockService }],
    }).compile();

    controller = module.get<PdfController>(PdfController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('contractPdf', () => {
    it('should return PDF buffer with correct headers', async () => {
      const res = mockResponse();
      await controller.contractPdf('uuid-1', res);

      expect(mockService.generateContractPdf).toHaveBeenCalledWith('uuid-1');
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });

  describe('invoicePdf', () => {
    it('should return PDF buffer with correct headers', async () => {
      const res = mockResponse();
      await controller.invoicePdf('uuid-2', res);

      expect(mockService.generateInvoicePdf).toHaveBeenCalledWith('uuid-2');
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });

  describe('propertyPdf', () => {
    it('should return PDF buffer with correct headers', async () => {
      const res = mockResponse();
      await controller.propertyPdf('uuid-3', res);

      expect(mockService.generatePropertyPdf).toHaveBeenCalledWith('uuid-3');
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });

  describe('generateReport', () => {
    it('should generate monthly revenue report', async () => {
      const res = mockResponse();
      const dto = { type: ReportType.MONTHLY_REVENUE, month: '2026-03' };
      await controller.generateReport(dto, res);

      expect(mockService.generateReport).toHaveBeenCalledWith(
        ReportType.MONTHLY_REVENUE,
        '2026-03',
        undefined,
      );
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should generate agent performance report', async () => {
      const res = mockResponse();
      const dto = {
        type: ReportType.AGENT_PERFORMANCE,
        month: '2026-03',
        agentId: 'agent-1',
      };
      await controller.generateReport(dto, res);

      expect(mockService.generateReport).toHaveBeenCalledWith(
        ReportType.AGENT_PERFORMANCE,
        '2026-03',
        'agent-1',
      );
      expect(res.end).toHaveBeenCalledWith(mockPdfBuffer);
    });
  });
});
