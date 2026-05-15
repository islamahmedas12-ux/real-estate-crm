import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { SanitizeNotFoundFilter } from './sanitize-not-found.filter.js';

describe('SanitizeNotFoundFilter', () => {
  let filter: SanitizeNotFoundFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new SanitizeNotFoundFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('returns 404 with generic message without raw path', () => {
    const exception = new NotFoundException('/api/nonexistent/<script>xss</script>');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('Not Found');
    expect(JSON.stringify(body)).not.toContain('<script>');
  });

  it('always returns 404 status even with custom message', () => {
    const exception = new NotFoundException('Custom not found message');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    const body = mockResponse.json.mock.calls[0][0];
    expect(body.message).toBe('Not Found');
  });
});
