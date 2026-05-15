import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    // Mock env vars to avoid needing a real DB connection
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.DATABASE_POOL_SIZE = '5';
    process.env.DATABASE_IDLE_TIMEOUT = '15000';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connection lifecycle', () => {
    it('logs on module init', async () => {
      service = new PrismaService();
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith('Database connection pool initialized');
    });

    it('logs on module destroy', async () => {
      service = new PrismaService();
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.onModuleDestroy();

      expect(logSpy).toHaveBeenCalledWith('Database connection pool closed');
    });
  });
});
