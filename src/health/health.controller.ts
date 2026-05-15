import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

function resolveVersion(): string {
  // __dirname differs between dist (dist/src/health) and ts-jest (src/health),
  // so probe a few candidate locations and fall back gracefully.
  for (const rel of [
    ['..', '..', '..'],
    ['..', '..', '..', '..'],
    ['..', '..'],
  ]) {
    try {
      const raw = readFileSync(join(__dirname, ...rel, 'package.json'), 'utf-8');
      const parsed = JSON.parse(raw) as { name?: string; version?: string };
      if (parsed.name === 'real-estate-crm' && parsed.version) return parsed.version;
    } catch {
      // try next candidate
    }
  }
  return process.env['npm_package_version'] ?? '0.0.0';
}

const pkg = { version: resolveVersion() };

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  version: string;
}

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'Service health status' })
  async check(): Promise<HealthResponse> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000,
      database: dbStatus,
      version: pkg.version,
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — is the process alive?' })
  @ApiOkResponse({ description: 'Process is alive' })
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — is the service ready to accept traffic?' })
  @ApiOkResponse({ description: 'Service readiness status' })
  async ready(): Promise<{ status: string }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
