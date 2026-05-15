import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockRequest = { url: '/api/test' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  describe('production mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('sanitizes HttpException messages to generic error in production', () => {
      process.env.NODE_ENV = 'production';

      const exception = new HttpException('Sensitive error detail', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('Internal server error');
      // Production must not leak the specific error type either
      expect(body.error).toBe('Internal Server Error');
      expect(body.path).toBe('/api/test');
    });

    it('sanitizes non-HTTP exceptions in production', () => {
      process.env.NODE_ENV = 'production';

      const exception = new Error('/path/to/project/src/service.ts:45:16 sensitive detail');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('Internal server error');
      expect(body.error).toBe('Internal Server Error');
      expect(body.path).toBe('/api/test');
      expect(body.path).not.toContain('src/service.ts');
    });

    it('returns generic error for unknown exceptions in production', () => {
      process.env.NODE_ENV = 'production';

      filter.catch('unknown error', mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('Internal server error');
    });
  });

  describe('non-production mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('preserves HttpException message in non-production', () => {
      process.env.NODE_ENV = 'development';

      const exception = new HttpException('Detailed validation error', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('Detailed validation error');
    });

    it('preserves Error message in non-production', () => {
      process.env.NODE_ENV = 'development';

      const exception = new Error('/path/to/project/src/service.ts:45:16 stack trace info');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('/path/to/project/src/service.ts:45:16 stack trace info');
    });
  });
});
