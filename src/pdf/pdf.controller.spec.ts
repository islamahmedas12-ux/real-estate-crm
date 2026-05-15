import { Test, TestingModule } from '@nestjs/testing';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { ReportType } from './dto/generate-report.dto';

const mockService = {
  streamContractPdf: jest.fn().mockResolvedValue(undefined),
  streamInvoicePdf: jest.fn().mockResolvedValue(undefined),
  streamPropertyPdf: jest.fn().mockResolvedValue(undefined),
  streamReport: jest.fn().mockResolvedValue(undefined),
};

const mockResponse = () => {
  const res: any = {};
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
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
    it('streams the contract PDF to the response', async () => {
      const res = mockResponse();
      await controller.contractPdf('uuid-1', res);
      expect(mockService.streamContractPdf).toHaveBeenCalledWith('uuid-1', res);
    });
  });

  describe('invoicePdf', () => {
    it('streams the invoice PDF to the response', async () => {
      const res = mockResponse();
      await controller.invoicePdf('uuid-2', res);
      expect(mockService.streamInvoicePdf).toHaveBeenCalledWith('uuid-2', res);
    });
  });

  describe('propertyPdf', () => {
    it('streams the property PDF to the response', async () => {
      const res = mockResponse();
      await controller.propertyPdf('uuid-3', res);
      expect(mockService.streamPropertyPdf).toHaveBeenCalledWith('uuid-3', res);
    });
  });

  describe('generateReport', () => {
    it('streams a monthly revenue report', async () => {
      const res = mockResponse();
      const dto = { type: ReportType.MONTHLY_REVENUE, month: '2026-03' };
      await controller.generateReport(dto, res);

      expect(mockService.streamReport).toHaveBeenCalledWith(
        ReportType.MONTHLY_REVENUE,
        '2026-03',
        undefined,
        res,
        expect.any(String),
      );
    });

    it('streams an agent performance report', async () => {
      const res = mockResponse();
      const dto = {
        type: ReportType.AGENT_PERFORMANCE,
        month: '2026-03',
        agentId: 'agent-1',
      };
      await controller.generateReport(dto, res);

      expect(mockService.streamReport).toHaveBeenCalledWith(
        ReportType.AGENT_PERFORMANCE,
        '2026-03',
        'agent-1',
        res,
        expect.any(String),
      );
    });
  });
});
