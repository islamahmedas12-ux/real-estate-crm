import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const mockPrisma = {
  setting: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('returns the value when setting exists', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({ key: 'test', value: { foo: 'bar' } });

      const result = await service.get('test');

      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns empty object when setting not found', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);

      const result = await service.get('nonexistent');

      expect(result).toEqual({});
    });
  });

  describe('set', () => {
    it('creates new setting via upsert', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({ key: 'new_key', value: { val: 1 } });

      const result = await service.set('new_key', { val: 1 });

      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'new_key' },
        update: { value: { val: 1 } },
        create: { key: 'new_key', value: { val: 1 } },
      });
      expect(result).toEqual({ val: 1 });
    });

    it('updates existing setting via upsert', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({ key: 'existing', value: { updated: true } });

      const result = await service.set('existing', { updated: true });

      expect(result).toEqual({ updated: true });
    });
  });
});