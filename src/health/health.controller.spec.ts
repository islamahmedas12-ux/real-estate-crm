import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return ok when database is connected', async () => {
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });

    it('should return degraded when database is down', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await controller.check();
      expect(result.status).toBe('degraded');
      expect(result.database).toBe('disconnected');
    });
  });

  describe('live', () => {
    it('should return ok', () => {
      expect(controller.live()).toEqual({ status: 'ok' });
    });
  });

  describe('ready', () => {
    it('should return ok when database responds', async () => {
      const result = await controller.ready();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should throw when database is down', async () => {
      prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(controller.ready()).rejects.toThrow('Connection refused');
    });
  });
});
