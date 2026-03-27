import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { ClientsModule } from './clients/clients.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { ContractsModule } from './contracts/contracts.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { ActivitiesModule } from './activities/activities.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { EmailModule } from './email/email.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env['THROTTLE_TTL'] ?? '60000', 10),
        limit: parseInt(process.env['THROTTLE_LIMIT'] ?? '100', 10),
      },
    ]),
    PrismaModule,
    // AuthModule must be imported before feature modules so the global guard
    // and AuthService are available throughout the dependency graph.
    AuthModule,
    ClientsModule,
    PropertiesModule,
    ContractsModule,
    InvoicesModule,
    LeadsModule,
    PdfModule,
    ActivitiesModule,
    UploadsModule,
    DashboardModule,
    EmailModule,
    HealthModule,
  ],
  providers: [
    // Rate limiting — applied first, before auth
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT authentication — all routes require a valid Authme token
    // unless decorated with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
