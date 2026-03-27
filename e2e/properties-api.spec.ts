// Set required env vars before any module imports
process.env.AUTHME_URL = process.env.AUTHME_URL || 'http://localhost:3001';
process.env.AUTHME_REALM = process.env.AUTHME_REALM || 'real-estate-test';
process.env.AUTHME_CLIENT_ID = process.env.AUTHME_CLIENT_ID || 'crm-backend';
process.env.AUTHME_CLIENT_SECRET = process.env.AUTHME_CLIENT_SECRET || 'test-secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import { PropertyStatus, PropertyType, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'test-admin-id',
    authmeId: 'authme-admin-001',
    sub: 'authme-admin-001',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    roles: ['admin'],
    isActive: true,
    ...overrides,
  };
}

const adminUser = makeUser();
const managerUser = makeUser({
  id: 'test-manager-id',
  authmeId: 'authme-manager-001',
  sub: 'authme-manager-001',
  email: 'manager@test.com',
  firstName: 'Manager',
  lastName: 'User',
  role: UserRole.MANAGER,
  roles: ['manager'],
});
const agentUser = makeUser({
  id: 'test-agent-id',
  authmeId: 'authme-agent-001',
  sub: 'authme-agent-001',
  email: 'agent@test.com',
  firstName: 'Agent',
  lastName: 'User',
  role: UserRole.AGENT,
  roles: ['agent'],
});

const VALID_PROPERTY = {
  title: 'Test Apartment in Zamalek',
  description: 'A beautiful test apartment',
  type: 'APARTMENT' as PropertyType,
  price: '2500000.00',
  area: '180.00',
  bedrooms: 3,
  bathrooms: 2,
  floor: 5,
  address: '15 Abu El Feda St',
  city: 'Cairo',
  region: 'Zamalek',
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Properties API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentUser: AuthenticatedUser;

  // Track created resources for cleanup
  const createdPropertyIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    currentUser = adminUser;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = currentUser;
          return true;
        },
      })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Seed test users so FK constraints are satisfied
    for (const u of [adminUser, managerUser, agentUser]) {
      await prisma.user.upsert({
        where: { authmeId: u.authmeId },
        update: {},
        create: {
          id: u.id,
          authmeId: u.authmeId,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: true,
        },
      });
      createdUserIds.push(u.id);
    }
  });

  afterAll(async () => {
    // Clean up in reverse-dependency order
    if (createdPropertyIds.length) {
      await prisma.propertyImage.deleteMany({
        where: { propertyId: { in: createdPropertyIds } },
      });
      await prisma.property.deleteMany({
        where: { id: { in: createdPropertyIds } },
      });
    }
    for (const uid of createdUserIds) {
      await prisma.user.deleteMany({ where: { id: uid } });
    }
    await app.close();
  });

  // Helper to switch the active user for the next request(s)
  function actAs(user: AuthenticatedUser) {
    currentUser = user;
  }

  // Convenience to create a property and track it for cleanup
  async function createProperty(overrides: Record<string, unknown> = {}) {
    actAs(adminUser);
    const res = await request(app.getHttpServer())
      .post('/api/properties')
      .send({ ...VALID_PROPERTY, ...overrides })
      .expect(201);
    createdPropertyIds.push(res.body.id);
    return res.body;
  }

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------
  describe('CRUD Operations', () => {
    it('POST /api/properties — should create a property (admin)', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .post('/api/properties')
        .send(VALID_PROPERTY)
        .expect(201);

      createdPropertyIds.push(res.body.id);

      expect(res.body).toMatchObject({
        title: VALID_PROPERTY.title,
        type: VALID_PROPERTY.type,
        status: PropertyStatus.AVAILABLE,
        city: VALID_PROPERTY.city,
      });
      expect(res.body.id).toBeDefined();
    });

    it('POST /api/properties — should create a property (manager)', async () => {
      actAs(managerUser);
      const res = await request(app.getHttpServer())
        .post('/api/properties')
        .send({ ...VALID_PROPERTY, title: 'Manager Property' })
        .expect(201);

      createdPropertyIds.push(res.body.id);
      expect(res.body.title).toBe('Manager Property');
    });

    it('POST /api/properties — should reject missing required fields', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .post('/api/properties')
        .send({ title: 'Incomplete' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('POST /api/properties — should reject invalid property type', async () => {
      actAs(adminUser);
      await request(app.getHttpServer())
        .post('/api/properties')
        .send({ ...VALID_PROPERTY, type: 'IGLOO' })
        .expect(400);
    });

    it('GET /api/properties — should return paginated list', async () => {
      actAs(adminUser);
      // Ensure at least one property exists
      await createProperty({ title: 'List Test Property' });

      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 5);
      expect(res.body).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/properties/:id — should return a single property', async () => {
      const prop = await createProperty({ title: 'FindOne Test' });

      const res = await request(app.getHttpServer())
        .get(`/api/properties/${prop.id}`)
        .expect(200);

      expect(res.body.id).toBe(prop.id);
      expect(res.body.title).toBe('FindOne Test');
      expect(res.body).toHaveProperty('images');
      expect(res.body).toHaveProperty('_count');
    });

    it('GET /api/properties/:id — should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .get('/api/properties/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('GET /api/properties/:id — should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/properties/not-a-uuid')
        .expect(400);
    });

    it('PUT /api/properties/:id — should update a property', async () => {
      const prop = await createProperty({ title: 'Before Update' });

      const res = await request(app.getHttpServer())
        .put(`/api/properties/${prop.id}`)
        .send({ title: 'After Update', bedrooms: 5 })
        .expect(200);

      expect(res.body.title).toBe('After Update');
      expect(res.body.bedrooms).toBe(5);
    });

    it('PUT /api/properties/:id — should return 404 for non-existent property', async () => {
      await request(app.getHttpServer())
        .put('/api/properties/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Ghost' })
        .expect(404);
    });

    it('DELETE /api/properties/:id — should soft-delete (set OFF_MARKET)', async () => {
      actAs(adminUser);
      const prop = await createProperty({ title: 'To Delete' });

      const res = await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}`)
        .expect(200);

      expect(res.body.status).toBe(PropertyStatus.OFF_MARKET);

      // Verify via GET
      const fetched = await request(app.getHttpServer())
        .get(`/api/properties/${prop.id}`)
        .expect(200);
      expect(fetched.body.status).toBe(PropertyStatus.OFF_MARKET);
    });

    it('DELETE /api/properties/:id — should return 404 for non-existent', async () => {
      actAs(adminUser);
      await request(app.getHttpServer())
        .delete('/api/properties/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // -----------------------------------------------------------------------
  // Status Transitions
  // -----------------------------------------------------------------------
  describe('Status Transitions', () => {
    it('PATCH /api/properties/:id/status — should change status AVAILABLE → RESERVED', async () => {
      const prop = await createProperty();

      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.RESERVED })
        .expect(200);

      expect(res.body.status).toBe(PropertyStatus.RESERVED);
    });

    it('PATCH /api/properties/:id/status — should change status RESERVED → SOLD', async () => {
      const prop = await createProperty();

      actAs(managerUser);
      // First move to RESERVED
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.RESERVED })
        .expect(200);

      // Then to SOLD
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.SOLD })
        .expect(200);

      expect(res.body.status).toBe(PropertyStatus.SOLD);
    });

    it('PATCH /api/properties/:id/status — should change to RENTED', async () => {
      const prop = await createProperty();

      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.RENTED })
        .expect(200);

      expect(res.body.status).toBe(PropertyStatus.RENTED);
    });

    it('PATCH /api/properties/:id/status — should change to OFF_MARKET', async () => {
      const prop = await createProperty();

      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.OFF_MARKET })
        .expect(200);

      expect(res.body.status).toBe(PropertyStatus.OFF_MARKET);
    });

    it('PATCH /api/properties/:id/status — should reject invalid status value', async () => {
      const prop = await createProperty();

      actAs(adminUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: 'DEMOLISHED' })
        .expect(400);
    });

    it('PATCH /api/properties/:id/status — should return 404 for non-existent property', async () => {
      actAs(adminUser);
      await request(app.getHttpServer())
        .patch('/api/properties/00000000-0000-0000-0000-000000000000/status')
        .send({ status: PropertyStatus.SOLD })
        .expect(404);
    });
  });

  // -----------------------------------------------------------------------
  // RBAC
  // -----------------------------------------------------------------------
  describe('RBAC — Role-Based Access Control', () => {
    it('POST /api/properties — agent should be forbidden', async () => {
      actAs(agentUser);
      await request(app.getHttpServer())
        .post('/api/properties')
        .send(VALID_PROPERTY)
        .expect(403);
    });

    it('DELETE /api/properties/:id — agent should be forbidden', async () => {
      const prop = await createProperty();
      actAs(agentUser);
      await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}`)
        .expect(403);
    });

    it('DELETE /api/properties/:id — manager should be forbidden', async () => {
      const prop = await createProperty();
      actAs(managerUser);
      await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}`)
        .expect(403);
    });

    it('PATCH /api/properties/:id/status — agent should be forbidden', async () => {
      const prop = await createProperty();
      actAs(agentUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.SOLD })
        .expect(403);
    });

    it('PATCH /api/properties/:id/status — manager should be allowed', async () => {
      const prop = await createProperty();
      actAs(managerUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/status`)
        .send({ status: PropertyStatus.RESERVED })
        .expect(200);
    });

    it('PATCH /api/properties/:id/assign — agent should be forbidden', async () => {
      const prop = await createProperty();
      actAs(agentUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/assign`)
        .send({ agentId: agentUser.id })
        .expect(403);
    });

    it('PATCH /api/properties/:id/assign — manager should be allowed', async () => {
      const prop = await createProperty();
      actAs(managerUser);
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/assign`)
        .send({ agentId: agentUser.id })
        .expect(200);

      expect(res.body.assignedAgentId).toBe(agentUser.id);
    });

    it('GET /api/properties — agent sees only own properties', async () => {
      // Create a property assigned to the agent
      const assigned = await createProperty({ title: 'Agent Assigned Prop' });
      actAs(adminUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${assigned.id}/assign`)
        .send({ agentId: agentUser.id })
        .expect(200);

      // Create an unassigned property
      await createProperty({ title: 'Unassigned Prop' });

      // Agent should only see assigned properties
      actAs(agentUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ limit: 100 })
        .expect(200);

      for (const prop of res.body.data) {
        expect(prop.assignedAgentId).toBe(agentUser.id);
      }
    });

    it('PUT /api/properties/:id — agent can update (no role restriction on update)', async () => {
      const prop = await createProperty({ title: 'Agent Editable' });
      actAs(agentUser);
      const res = await request(app.getHttpServer())
        .put(`/api/properties/${prop.id}`)
        .send({ title: 'Agent Edited' })
        .expect(200);

      expect(res.body.title).toBe('Agent Edited');
    });
  });

  // -----------------------------------------------------------------------
  // Agent Assignment
  // -----------------------------------------------------------------------
  describe('Agent Assignment', () => {
    it('PATCH /api/properties/:id/assign — should assign agent', async () => {
      const prop = await createProperty();
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/assign`)
        .send({ agentId: agentUser.id })
        .expect(200);

      expect(res.body.assignedAgentId).toBe(agentUser.id);
    });

    it('PATCH /api/properties/:id/assign — should reject assigning ADMIN as agent', async () => {
      const prop = await createProperty();
      actAs(adminUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/assign`)
        .send({ agentId: adminUser.id })
        .expect(400);
    });

    it('PATCH /api/properties/:id/assign — should 404 for non-existent user', async () => {
      const prop = await createProperty();
      actAs(adminUser);
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/assign`)
        .send({ agentId: '00000000-0000-0000-0000-000000000099' })
        .expect(404);
    });
  });

  // -----------------------------------------------------------------------
  // Search & Filter
  // -----------------------------------------------------------------------
  describe('Search & Filter', () => {
    let searchProp1: any;
    let searchProp2: any;
    let searchProp3: any;

    beforeAll(async () => {
      searchProp1 = await createProperty({
        title: 'Luxury Villa in New Cairo',
        type: PropertyType.VILLA,
        price: '5000000.00',
        area: '350.00',
        bedrooms: 5,
        city: 'Cairo',
        region: 'New Cairo',
      });
      searchProp2 = await createProperty({
        title: 'Studio in Alexandria',
        type: PropertyType.STUDIO,
        price: '500000.00',
        area: '45.00',
        bedrooms: 0,
        city: 'Alexandria',
        region: 'Smouha',
      });
      searchProp3 = await createProperty({
        title: 'Office Space Downtown',
        type: PropertyType.OFFICE,
        price: '3000000.00',
        area: '200.00',
        city: 'Cairo',
        region: 'Downtown',
      });
    });

    it('should filter by property type', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ type: PropertyType.VILLA })
        .expect(200);

      for (const p of res.body.data) {
        expect(p.type).toBe(PropertyType.VILLA);
      }
    });

    it('should filter by status', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ status: PropertyStatus.AVAILABLE })
        .expect(200);

      for (const p of res.body.data) {
        expect(p.status).toBe(PropertyStatus.AVAILABLE);
      }
    });

    it('should filter by city (case-insensitive)', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ city: 'alexandria' })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const p of res.body.data) {
        expect(p.city.toLowerCase()).toContain('alexandria');
      }
    });

    it('should filter by price range', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ minPrice: '1000000', maxPrice: '4000000' })
        .expect(200);

      for (const p of res.body.data) {
        const price = parseFloat(p.price);
        expect(price).toBeGreaterThanOrEqual(1000000);
        expect(price).toBeLessThanOrEqual(4000000);
      }
    });

    it('should filter by area range', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ minArea: '100', maxArea: '400' })
        .expect(200);

      for (const p of res.body.data) {
        const area = parseFloat(p.area);
        expect(area).toBeGreaterThanOrEqual(100);
        expect(area).toBeLessThanOrEqual(400);
      }
    });

    it('should filter by minimum bedrooms', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ bedrooms: 3 })
        .expect(200);

      for (const p of res.body.data) {
        expect(p.bedrooms).toBeGreaterThanOrEqual(3);
      }
    });

    it('should search by text (title/description/address)', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ search: 'Luxury Villa' })
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const titles = res.body.data.map((p: any) => p.title);
      expect(titles).toContain('Luxury Villa in New Cairo');
    });

    it('should sort by price ascending', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ sortBy: 'price', sortOrder: 'asc', limit: 50 })
        .expect(200);

      const prices = res.body.data.map((p: any) => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should sort by price descending', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ sortBy: 'price', sortOrder: 'desc', limit: 50 })
        .expect(200);

      const prices = res.body.data.map((p: any) => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it('GET /api/properties/search — full-text search', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties/search')
        .query({ q: 'Villa Cairo' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('nextCursor');
      expect(res.body).toHaveProperty('hasMore');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/properties/search — empty query returns empty results', async () => {
      actAs(adminUser);
      // The DTO requires q to be non-empty, so passing empty string should 400
      await request(app.getHttpServer())
        .get('/api/properties/search')
        .query({ q: '' })
        .expect(400);
    });

    it('GET /api/properties/search — respects take parameter', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties/search')
        .query({ q: 'Cairo', take: 2 })
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------
  describe('Pagination', () => {
    beforeAll(async () => {
      // Ensure we have enough properties for pagination tests
      const existing = await prisma.property.count();
      const needed = Math.max(0, 8 - existing);
      for (let i = 0; i < needed; i++) {
        await createProperty({ title: `Pagination Prop ${i}` });
      }
    });

    it('should return correct page size', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(3);
      expect(res.body.limit).toBe(3);
    });

    it('should return correct total count', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.totalPages).toBe(Math.ceil(res.body.total / 2));
    });

    it('should paginate correctly across pages', async () => {
      actAs(adminUser);
      const page1 = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 1, limit: 3 })
        .expect(200);

      const page2 = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 2, limit: 3 })
        .expect(200);

      // No overlapping IDs between pages
      const ids1 = page1.body.data.map((p: any) => p.id);
      const ids2 = page2.body.data.map((p: any) => p.id);
      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should return empty data for page beyond total', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .query({ page: 9999, limit: 10 })
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('should default to page 1 and limit 20', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .expect(200);

      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
    });
  });

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------
  describe('Stats', () => {
    it('GET /api/properties/stats — should return grouped statistics', async () => {
      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .get('/api/properties/stats')
        .expect(200);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('byType');
      expect(res.body).toHaveProperty('byStatus');
      expect(res.body).toHaveProperty('byCity');
      expect(Array.isArray(res.body.byType)).toBe(true);
      expect(Array.isArray(res.body.byStatus)).toBe(true);
      expect(Array.isArray(res.body.byCity)).toBe(true);

      if (res.body.byType.length > 0) {
        expect(res.body.byType[0]).toHaveProperty('type');
        expect(res.body.byType[0]).toHaveProperty('count');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Image Upload & Deletion
  // -----------------------------------------------------------------------
  describe('Image Upload & Deletion', () => {
    let testImageBuffer: Buffer;

    beforeAll(() => {
      // Create a minimal valid JPEG buffer (1x1 pixel)
      // JPEG SOI + JFIF header + minimal data + EOI
      testImageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
        0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
        0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
        0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
        0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
        0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3f, 0x00, 0x7b, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xd9,
      ]);
    });

    it('POST /api/properties/:id/images — should upload an image', async () => {
      const prop = await createProperty({ title: 'Image Upload Test' });

      actAs(adminUser);
      const res = await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('url');
      expect(res.body[0].propertyId).toBe(prop.id);
      expect(res.body[0].isPrimary).toBe(true); // First image is primary
    });

    it('POST /api/properties/:id/images — second image should not be primary', async () => {
      const prop = await createProperty({ title: 'Multi-Image Test' });

      actAs(adminUser);
      // Upload first
      await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'first.jpg', contentType: 'image/jpeg' })
        .expect(201);

      // Upload second
      const res = await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'second.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(res.body[0].isPrimary).toBe(false);
    });

    it('POST /api/properties/:id/images — should return 404 for non-existent property', async () => {
      actAs(adminUser);
      await request(app.getHttpServer())
        .post('/api/properties/00000000-0000-0000-0000-000000000000/images')
        .attach('images', testImageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
        .expect(404);
    });

    it('DELETE /api/properties/:id/images/:imageId — should delete an image', async () => {
      const prop = await createProperty({ title: 'Image Delete Test' });

      actAs(adminUser);
      const uploadRes = await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'del.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const imageId = uploadRes.body[0].id;

      const res = await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}/images/${imageId}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('DELETE /api/properties/:id/images/:imageId — should promote next image on primary delete', async () => {
      const prop = await createProperty({ title: 'Primary Promotion Test' });

      actAs(adminUser);
      // Upload two images
      const res1 = await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'a.jpg', contentType: 'image/jpeg' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'b.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const primaryId = res1.body[0].id;

      // Delete the primary image
      await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}/images/${primaryId}`)
        .expect(200);

      // Verify next image became primary
      const propRes = await request(app.getHttpServer())
        .get(`/api/properties/${prop.id}`)
        .expect(200);

      const primaryImages = propRes.body.images.filter((img: any) => img.isPrimary);
      expect(primaryImages.length).toBe(1);
    });

    it('PATCH /api/properties/:id/images/:imageId/primary — should set primary image', async () => {
      const prop = await createProperty({ title: 'Set Primary Test' });

      actAs(adminUser);
      // Upload two images
      await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'x.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post(`/api/properties/${prop.id}/images`)
        .attach('images', testImageBuffer, { filename: 'y.jpg', contentType: 'image/jpeg' })
        .expect(201);

      const secondId = res2.body[0].id;

      // Set second as primary
      await request(app.getHttpServer())
        .patch(`/api/properties/${prop.id}/images/${secondId}/primary`)
        .expect(200);

      // Verify
      const propRes = await request(app.getHttpServer())
        .get(`/api/properties/${prop.id}`)
        .expect(200);

      const primary = propRes.body.images.find((img: any) => img.isPrimary);
      expect(primary.id).toBe(secondId);
    });

    it('DELETE /api/properties/:id/images/:imageId — should 404 for non-existent image', async () => {
      const prop = await createProperty({ title: 'Delete 404 Test' });
      actAs(adminUser);
      await request(app.getHttpServer())
        .delete(`/api/properties/${prop.id}/images/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });
  });
});
