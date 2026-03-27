import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';
import { ContractType, ContractStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  changeStatus: jest.fn(),
  findContractInvoices: jest.fn(),
  generateInvoices: jest.fn(),
  getStats: jest.fn(),
  getExpiring: jest.fn(),
};

const adminUser: AuthenticatedUser = {
  id: 'user-001',
  authmeId: 'admin-001',
  sub: 'admin-001',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  roles: ['admin'],
  isActive: true,
};

describe('ContractsController', () => {
  let controller: ContractsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [{ provide: ContractsService, useValue: mockService }],
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a contract', async () => {
    const dto = {
      type: ContractType.SALE,
      propertyId: 'prop-001',
      clientId: 'client-001',
      startDate: '2026-01-01',
      totalAmount: 100000,
    };
    mockService.create.mockResolvedValue({ id: 'c1', ...dto });

    const result = await controller.create(dto, adminUser);
    expect(result.id).toBe('c1');
    expect(mockService.create).toHaveBeenCalledWith(dto, adminUser);
  });

  it('should list contracts', async () => {
    const paginated = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    mockService.findAll.mockResolvedValue(paginated);

    const result = await controller.findAll({} as any, adminUser);
    expect(result).toEqual(paginated);
  });

  it('should get contract stats', async () => {
    const stats = { total: 5, byStatus: {}, byType: {}, totalValue: 0 };
    mockService.getStats.mockResolvedValue(stats);

    const result = await controller.getStats(adminUser);
    expect(result.total).toBe(5);
  });

  it('should get expiring contracts', async () => {
    mockService.getExpiring.mockResolvedValue([]);
    const result = await controller.getExpiring(30, adminUser);
    expect(result).toEqual([]);
  });

  it('should get single contract', async () => {
    mockService.findOne.mockResolvedValue({ id: 'c1' });
    const result = await controller.findOne('c1', adminUser);
    expect(result.id).toBe('c1');
  });

  it('should change contract status', async () => {
    mockService.changeStatus.mockResolvedValue({ id: 'c1', status: ContractStatus.ACTIVE });
    const result = await controller.changeStatus(
      'c1',
      { status: ContractStatus.ACTIVE },
      adminUser,
    );
    expect(result.status).toBe(ContractStatus.ACTIVE);
    expect(mockService.changeStatus).toHaveBeenCalledWith(
      'c1',
      { status: ContractStatus.ACTIVE },
      adminUser,
    );
  });

  it('should list contract invoices', async () => {
    mockService.findContractInvoices.mockResolvedValue([]);
    const result = await controller.findContractInvoices('c1', adminUser);
    expect(result).toEqual([]);
    expect(mockService.findContractInvoices).toHaveBeenCalledWith('c1', adminUser);
  });

  it('should generate invoices', async () => {
    mockService.generateInvoices.mockResolvedValue([{ id: 'inv1' }]);
    const result = await controller.generateInvoices('c1', {}, adminUser);
    expect(result).toHaveLength(1);
    expect(mockService.generateInvoices).toHaveBeenCalledWith('c1', {}, adminUser);
  });
});
