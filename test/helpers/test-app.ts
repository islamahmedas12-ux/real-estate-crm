import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppModule } from '../../src/app.module.js';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator.js';

// Default test users
export const TEST_ADMIN: AuthenticatedUser = {
  id: 'admin-001',
  authmeId: 'authme-admin-001',
  sub: 'authme-admin-001',
  email: 'admin-seed@crm-test.com',
  firstName: 'Islam',
  lastName: 'Admin',
  role: UserRole.ADMIN,
  roles: ['admin'],
  isActive: true,
};

export const TEST_MANAGER: AuthenticatedUser = {
  id: 'manager-001',
  authmeId: 'authme-manager-001',
  sub: 'authme-manager-001',
  email: 'manager@crm-test.com',
  firstName: 'Sara',
  lastName: 'Manager',
  role: UserRole.MANAGER,
  roles: ['manager'],
  isActive: true,
};

export const TEST_AGENT: AuthenticatedUser = {
  id: 'agent-001',
  authmeId: 'authme-agent-001',
  sub: 'authme-agent-001',
  email: 'agent1@crm-test.com',
  firstName: 'Ahmed',
  lastName: 'Hassan',
  role: UserRole.AGENT,
  roles: ['agent'],
  isActive: true,
};

// Mutable current user — change this in tests to switch roles
let currentUser: AuthenticatedUser = TEST_ADMIN;

export function setCurrentUser(user: AuthenticatedUser) {
  currentUser = user;
}

export function getCurrentUser(): AuthenticatedUser {
  return currentUser;
}

// Mock JWT Auth Guard — skips JWT validation, injects currentUser
const MockJwtAuthGuard = {
  canActivate: (context: any) => {
    const request = context.switchToHttp().getRequest();
    request.user = getCurrentUser();
    return true;
  },
};

// Mock Roles Guard — checks role from currentUser
const MockRolesGuard = {
  canActivate: (context: any) => {
    const handler = context.getHandler();
    const classRef = context.getClass();
    const requiredRoles: string[] =
      Reflect.getMetadata('roles', handler) || Reflect.getMetadata('roles', classRef) || [];

    if (requiredRoles.length === 0) return true;

    const user = getCurrentUser();
    return requiredRoles.some((role) => user.roles?.includes(role));
  },
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard('JwtAuthGuard')
    .useValue(MockJwtAuthGuard)
    .overrideProvider(APP_GUARD)
    .useValue(MockJwtAuthGuard)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}
