import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const mockPrisma = {
  idempotencyKey: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

function mockContext(key: string | null, userId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { 'idempotency-key': key ?? undefined },
        user: userId ? { id: userId } : undefined,
        route: { path: '/test' },
        url: '/test',
      }),
      getResponse: () => ({
        setHeader: jest.fn(),
      }),
    }),
  } as unknown as ExecutionContext;
}

function mockCallHandler(data: unknown): CallHandler {
  return {
    handle: () => of(data),
  };
}

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyInterceptor,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
    jest.clearAllMocks();
  });

  it('passes through when no idempotency key is provided', (done) => {
    const context = mockContext(null);
    const handler = mockCallHandler({ result: 'ok' });

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ result: 'ok' });
      done();
    });
  });

  it('returns existing response when key is found', (done) => {
    mockPrisma.idempotencyKey.findUnique.mockResolvedValue({
      key: 'abc',
      endpoint: '/test',
      userId: 'user1',
      response: { existing: true },
    });

    const context = mockContext('abc', 'user1');
    const handler = mockCallHandler({ new: true });

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ existing: true });
      done();
    });
  });

  it('stores new response after handler executes', (done) => {
    mockPrisma.idempotencyKey.findUnique.mockResolvedValue(null);
    mockPrisma.idempotencyKey.create.mockResolvedValue({});

    const context = mockContext('new-key', 'user1');
    const handler = mockCallHandler({ stored: true });

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(mockPrisma.idempotencyKey.create).toHaveBeenCalledWith({
        data: {
          key: 'new-key',
          endpoint: '/test',
          userId: 'user1',
          response: { stored: true },
        },
      });
      expect(result).toEqual({ stored: true });
      done();
    });
  });
});