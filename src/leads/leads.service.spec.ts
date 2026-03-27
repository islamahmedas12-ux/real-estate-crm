import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeadStatus, LeadPriority, LeadActivityType } from '@prisma/client';

const mockPrisma = {
  lead: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  leadActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    jest.clearAllMocks();
  });

  const sampleLead = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    clientId: '223e4567-e89b-12d3-a456-426614174001',
    propertyId: '323e4567-e89b-12d3-a456-426614174002',
    status: LeadStatus.NEW,
    priority: LeadPriority.MEDIUM,
    source: 'Website',
    budget: 500000,
    notes: 'Interested in 3-bedroom',
    assignedAgentId: 'agent-001',
    nextFollowUp: new Date('2026-04-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const performedBy = 'user-001';

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a lead with default status NEW', async () => {
      mockPrisma.lead.create.mockResolvedValue(sampleLead);
      mockPrisma.leadActivity.create.mockResolvedValue({});

      const dto = {
        clientId: sampleLead.clientId,
        propertyId: sampleLead.propertyId,
        source: 'Website',
        budget: 500000,
      };

      const result = await service.create(dto, performedBy);

      expect(result).toEqual(sampleLead);
      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          status: LeadStatus.NEW,
        },
      });
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: sampleLead.id,
          type: LeadActivityType.STATUS_CHANGE,
          performedBy,
        }),
      });
    });

    it('should create a lead with explicit status', async () => {
      const leadWithStatus = { ...sampleLead, status: LeadStatus.CONTACTED };
      mockPrisma.lead.create.mockResolvedValue(leadWithStatus);
      mockPrisma.leadActivity.create.mockResolvedValue({});

      const dto = {
        clientId: sampleLead.clientId,
        status: LeadStatus.CONTACTED,
      };

      const result = await service.create(dto, performedBy);

      expect(result.status).toBe(LeadStatus.CONTACTED);
      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          status: LeadStatus.CONTACTED,
        },
      });
    });

    it('should record a creation activity', async () => {
      mockPrisma.lead.create.mockResolvedValue(sampleLead);
      mockPrisma.leadActivity.create.mockResolvedValue({});

      await service.create({ clientId: sampleLead.clientId }, performedBy);

      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: {
          leadId: sampleLead.id,
          type: LeadActivityType.STATUS_CHANGE,
          description: `Lead created with status ${sampleLead.status}`,
          performedBy,
        },
      });
    });
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const leads = [sampleLead];
      mockPrisma.lead.findMany.mockResolvedValue(leads);
      mockPrisma.lead.count.mockResolvedValue(1);

      const filter = { page: 1, limit: 20, skip: 0 } as any;
      const result = await service.findAll(filter, undefined, true);

      expect(result.data).toEqual(leads);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should scope to agent when not admin/manager', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        'agent-123',
        false,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedAgentId: 'agent-123' }),
        }),
      );
    });

    it('should not scope by agent for admin/manager users', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        'agent-123',
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ assignedAgentId: 'agent-123' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, status: LeadStatus.QUALIFIED } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: LeadStatus.QUALIFIED }),
        }),
      );
    });

    it('should filter by priority', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, priority: LeadPriority.HIGH } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: LeadPriority.HIGH }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-12-31');
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, dateFrom, dateTo } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: dateFrom, lte: dateTo },
          }),
        }),
      );
    });

    it('should support search across client fields and notes', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, search: 'Ahmed' } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { client: { firstName: { contains: 'Ahmed', mode: 'insensitive' } } },
              { client: { lastName: { contains: 'Ahmed', mode: 'insensitive' } } },
              { client: { phone: { contains: 'Ahmed' } } },
              { notes: { contains: 'Ahmed', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should respect sortBy and sortOrder', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, sortBy: 'priority', sortOrder: 'asc' } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: 'asc' },
        }),
      );
    });

    it('should use default sort (createdAt desc) when not specified', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include client and property relations', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0 } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            client: expect.any(Object),
            property: expect.any(Object),
          }),
        }),
      );
    });

    it('should filter by assignedAgentId from filter dto', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      mockPrisma.lead.count.mockResolvedValue(0);

      await service.findAll(
        { page: 1, limit: 20, skip: 0, assignedAgentId: 'agent-xyz' } as any,
        undefined,
        true,
      );

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedAgentId: 'agent-xyz' }),
        }),
      );
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a lead with relations', async () => {
      const leadWithRelations = {
        ...sampleLead,
        client: { id: sampleLead.clientId, firstName: 'Ahmed', lastName: 'Hassan' },
        property: { id: sampleLead.propertyId, title: 'Villa' },
        activities: [],
        _count: { activities: 0 },
      };
      mockPrisma.lead.findUnique.mockResolvedValue(leadWithRelations);

      const result = await service.findOne(sampleLead.id);

      expect(result).toEqual(leadWithRelations);
      expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
        where: { id: sampleLead.id },
        include: expect.objectContaining({
          client: true,
          property: true,
          activities: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const updated = { ...sampleLead, notes: 'Updated notes' };
      mockPrisma.lead.update.mockResolvedValue(updated);

      const result = await service.update(sampleLead.id, { notes: 'Updated notes' });

      expect(result.notes).toBe('Updated notes');
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: sampleLead.id },
        data: { notes: 'Updated notes' },
      });
    });

    it('should throw NotFoundException on update of nonexistent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { notes: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update budget', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const updated = { ...sampleLead, budget: 750000 };
      mockPrisma.lead.update.mockResolvedValue(updated);

      const result = await service.update(sampleLead.id, { budget: 750000 });
      expect(result.budget).toBe(750000);
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a lead by setting status to LOST', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const removed = { ...sampleLead, status: LeadStatus.LOST };
      mockPrisma.lead.update.mockResolvedValue(removed);

      const result = await service.remove(sampleLead.id);

      expect(result.status).toBe(LeadStatus.LOST);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: sampleLead.id },
        data: { status: LeadStatus.LOST },
      });
    });

    it('should throw NotFoundException on remove of nonexistent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── changeStatus ─────────────────────────────────────────────────────────

  describe('changeStatus', () => {
    it('should transition from NEW to CONTACTED', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.CONTACTED };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.CONTACTED },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.CONTACTED);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should transition from NEW to LOST', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.LOST };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.LOST },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.LOST);
    });

    it('should transition from CONTACTED to QUALIFIED', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.CONTACTED,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.QUALIFIED };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.QUALIFIED },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.QUALIFIED);
    });

    it('should transition from QUALIFIED to PROPOSAL', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.QUALIFIED,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.PROPOSAL };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.PROPOSAL },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.PROPOSAL);
    });

    it('should transition from PROPOSAL to NEGOTIATION', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.PROPOSAL,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.NEGOTIATION };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.NEGOTIATION },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.NEGOTIATION);
    });

    it('should transition from NEGOTIATION to WON', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEGOTIATION,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.WON };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.WON },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.WON);
    });

    it('should transition from LOST back to NEW', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.LOST,
      });
      const updatedLead = { ...sampleLead, status: LeadStatus.NEW };
      mockPrisma.$transaction.mockResolvedValue([updatedLead, {}]);

      const result = await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.NEW },
        performedBy,
      );

      expect(result.status).toBe(LeadStatus.NEW);
    });

    it('should reject invalid transition from NEW to QUALIFIED', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });

      await expect(
        service.changeStatus(
          sampleLead.id,
          { status: LeadStatus.QUALIFIED },
          performedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition from NEW to WON', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });

      await expect(
        service.changeStatus(
          sampleLead.id,
          { status: LeadStatus.WON },
          performedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject any transition from WON', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.WON,
      });

      await expect(
        service.changeStatus(
          sampleLead.id,
          { status: LeadStatus.LOST },
          performedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transition from CONTACTED to NEW', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.CONTACTED,
      });

      await expect(
        service.changeStatus(
          sampleLead.id,
          { status: LeadStatus.NEW },
          performedBy,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.changeStatus(
          'nonexistent',
          { status: LeadStatus.CONTACTED },
          performedBy,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include notes in activity when provided', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });
      mockPrisma.$transaction.mockResolvedValue([
        { ...sampleLead, status: LeadStatus.CONTACTED },
        {},
      ]);

      await service.changeStatus(
        sampleLead.id,
        { status: LeadStatus.CONTACTED, notes: 'Called client' },
        performedBy,
      );

      // The $transaction is called with an array that includes the activity creation
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(2);
    });

    it('should include helpful message in BadRequestException', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: sampleLead.id,
        status: LeadStatus.NEW,
      });

      try {
        await service.changeStatus(
          sampleLead.id,
          { status: LeadStatus.WON },
          performedBy,
        );
        fail('Should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('NEW');
        expect(e.message).toContain('WON');
        expect(e.message).toContain('Allowed transitions');
      }
    });
  });

  // ─── assignAgent ──────────────────────────────────────────────────────────

  describe('assignAgent', () => {
    it('should assign an agent to a lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const assigned = { ...sampleLead, assignedAgentId: 'agent-456' };
      mockPrisma.lead.update.mockResolvedValue(assigned);

      const result = await service.assignAgent(sampleLead.id, 'agent-456');

      expect(result.assignedAgentId).toBe('agent-456');
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: sampleLead.id },
        data: { assignedAgentId: 'agent-456' },
      });
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.assignAgent('nonexistent', 'agent-456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── addActivity ──────────────────────────────────────────────────────────

  describe('addActivity', () => {
    it('should add an activity to a lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const activity = {
        id: 'activity-001',
        leadId: sampleLead.id,
        type: LeadActivityType.CALL,
        description: 'Called client',
        performedBy,
        createdAt: new Date(),
      };
      mockPrisma.leadActivity.create.mockResolvedValue(activity);

      const result = await service.addActivity(
        sampleLead.id,
        { type: LeadActivityType.CALL, description: 'Called client' },
        performedBy,
      );

      expect(result).toEqual(activity);
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
        data: {
          leadId: sampleLead.id,
          type: LeadActivityType.CALL,
          description: 'Called client',
          performedBy,
        },
      });
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.addActivity(
          'nonexistent',
          { type: LeadActivityType.NOTE, description: 'Test' },
          performedBy,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getActivities ────────────────────────────────────────────────────────

  describe('getActivities', () => {
    it('should return paginated activities', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      const activities = [
        {
          id: 'act-1',
          leadId: sampleLead.id,
          type: LeadActivityType.CALL,
          description: 'Called',
          performedBy,
          createdAt: new Date(),
        },
      ];
      mockPrisma.leadActivity.findMany.mockResolvedValue(activities);
      mockPrisma.leadActivity.count.mockResolvedValue(1);

      const result = await service.getActivities(sampleLead.id, 1, 20);

      expect(result.data).toEqual(activities);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate pagination correctly', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      mockPrisma.leadActivity.findMany.mockResolvedValue([]);
      mockPrisma.leadActivity.count.mockResolvedValue(50);

      const result = await service.getActivities(sampleLead.id, 3, 10);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockPrisma.leadActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.getActivities('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use default page and limit', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(sampleLead);
      mockPrisma.leadActivity.findMany.mockResolvedValue([]);
      mockPrisma.leadActivity.count.mockResolvedValue(0);

      const result = await service.getActivities(sampleLead.id);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─── getPipeline ──────────────────────────────────────────────────────────

  describe('getPipeline', () => {
    it('should return leads grouped by status', async () => {
      const leads = [
        { id: '1', status: LeadStatus.NEW, client: {}, property: {} },
        { id: '2', status: LeadStatus.NEW, client: {}, property: {} },
        { id: '3', status: LeadStatus.CONTACTED, client: {}, property: {} },
        { id: '4', status: LeadStatus.WON, client: {}, property: {} },
      ];
      mockPrisma.lead.findMany.mockResolvedValue(leads);

      const result = await service.getPipeline(undefined, true);

      expect(result[LeadStatus.NEW]).toHaveLength(2);
      expect(result[LeadStatus.CONTACTED]).toHaveLength(1);
      expect(result[LeadStatus.QUALIFIED]).toHaveLength(0);
      expect(result[LeadStatus.PROPOSAL]).toHaveLength(0);
      expect(result[LeadStatus.NEGOTIATION]).toHaveLength(0);
      expect(result[LeadStatus.WON]).toHaveLength(1);
      expect(result[LeadStatus.LOST]).toHaveLength(0);
    });

    it('should scope to agent when not admin/manager', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      await service.getPipeline('agent-123', false);

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assignedAgentId: 'agent-123' },
        }),
      );
    });

    it('should not scope for admin/manager', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      await service.getPipeline('agent-123', true);

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should return empty pipeline when no leads exist', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      const result = await service.getPipeline(undefined, true);

      for (const status of Object.values(LeadStatus)) {
        expect(result[status]).toEqual([]);
      }
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated statistics', async () => {
      mockPrisma.lead.count.mockResolvedValue(100);
      mockPrisma.lead.groupBy
        .mockResolvedValueOnce([
          { status: LeadStatus.NEW, _count: 40 },
          { status: LeadStatus.CONTACTED, _count: 30 },
        ])
        .mockResolvedValueOnce([
          { priority: LeadPriority.HIGH, _count: 25 },
          { priority: LeadPriority.MEDIUM, _count: 50 },
        ])
        .mockResolvedValueOnce([
          { source: 'Website', _count: 60 },
          { source: 'Referral', _count: 40 },
        ]);

      const stats = await service.getStats(undefined, true);

      expect(stats.total).toBe(100);
      expect(stats.byStatus).toHaveLength(2);
      expect(stats.byStatus).toEqual([
        { status: LeadStatus.NEW, count: 40 },
        { status: LeadStatus.CONTACTED, count: 30 },
      ]);
      expect(stats.byPriority).toHaveLength(2);
      expect(stats.bySource).toHaveLength(2);
    });

    it('should scope stats to agent when not admin/manager', async () => {
      mockPrisma.lead.count.mockResolvedValue(5);
      mockPrisma.lead.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getStats('agent-123', false);

      expect(mockPrisma.lead.count).toHaveBeenCalledWith({
        where: { assignedAgentId: 'agent-123' },
      });
    });

    it('should not scope stats for admin/manager', async () => {
      mockPrisma.lead.count.mockResolvedValue(100);
      mockPrisma.lead.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getStats('admin-001', true);

      expect(mockPrisma.lead.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return empty arrays when no leads', async () => {
      mockPrisma.lead.count.mockResolvedValue(0);
      mockPrisma.lead.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const stats = await service.getStats(undefined, true);

      expect(stats.total).toBe(0);
      expect(stats.byStatus).toEqual([]);
      expect(stats.byPriority).toEqual([]);
      expect(stats.bySource).toEqual([]);
    });
  });
});
