import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const mockPrisma = {
  idempotencyKey: { deleteMany: jest.fn() },
};

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('deletes expired idempotency keys', async () => {
      mockPrisma.idempotencyKey.deleteMany.mockResolvedValue({ count: 5 });

      await service.onModuleInit();

      expect(mockPrisma.idempotencyKey.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        }),
      );
    });

    it('does not throw if deleteMany fails', async () => {
      mockPrisma.idempotencyKey.deleteMany.mockRejectedValue(new Error('DB error'));

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });
});