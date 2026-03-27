import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PropertiesService - Full Text Search', () => {
  let service: PropertiesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
            property: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('fullTextSearch', () => {
    it('should return empty results for empty query', async () => {
      const result = await service.fullTextSearch('   ');
      expect(result).toEqual({ data: [], nextCursor: null, hasMore: false });
    });

    it('should sanitize special characters from query', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      await service.fullTextSearch('villa & cairo | test');
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return cursor paginated results', async () => {
      const mockResults = Array.from({ length: 3 }, (_, i) => ({
        id: `uuid-${i}`,
        title: `Property ${i}`,
        rank: 1 - i * 0.1,
      }));
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const result = await service.fullTextSearch('villa', undefined, 20);
      expect(result.data).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('uuid-2');
    });

    it('should indicate hasMore when results exceed take', async () => {
      const mockResults = Array.from({ length: 21 }, (_, i) => ({
        id: `uuid-${i}`,
        title: `Property ${i}`,
        rank: 1,
      }));
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

      const result = await service.fullTextSearch('villa', undefined, 20);
      expect(result.data).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('findAllCursor', () => {
    it('should return cursor paginated results', async () => {
      const mockProperties = Array.from({ length: 5 }, (_, i) => ({
        id: `uuid-${i}`,
        title: `Property ${i}`,
        images: [],
        _count: { leads: 0, contracts: 0 },
      }));
      (prisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);

      const filter = { page: 1, limit: 20, skip: 0 } as any;
      const result = await service.findAllCursor(filter, undefined, 20);
      expect(result.data).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });
  });
});
