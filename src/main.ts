import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security middleware — relax CSP for Swagger UI at /api/docs
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://validator.swagger.io'],
          connectSrc: ["'self'", 'https://dev-api.realstate-crm.homes'],
          fontSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
        },
      },
    }),
  );

  // CORS — allow both Admin and Agent portals
  app.enableCors({
    origin: [
      'https://dev-admin.realstate-crm.homes',
      'https://dev-agent.realstate-crm.homes',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger / OpenAPI at /api/docs
  const config = new DocumentBuilder()
    .setTitle('Real Estate CRM API')
    .setDescription(
      'Backend API for the Real Estate CRM platform.\n\n' +
        'Manages properties, clients, leads, contracts, invoices, and agent activities.\n\n' +
        'All protected endpoints require a Bearer token (JWT) from Authme IAM.',
    )
    .setVersion('1.0.0')
    .setContact('Real Estate CRM', '', '')
    .setLicense('Private', '')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Authme JWT token' },
      'bearer',
    )
    .addTag('Properties', 'Property listings management')
    .addTag('Clients', 'Client records management')
    .addTag('Leads', 'Lead pipeline and tracking')
    .addTag('Contracts', 'Contract lifecycle management')
    .addTag('Invoices', 'Invoice and payment management')
    .addTag('Activities', 'Audit trail and activity logs')
    .addTag('PDF Generation', 'Generate PDF documents')
    .addTag('Property Images', 'Upload and manage property images')
    .addTag('Contract Documents', 'Upload contract documents')
    .addTag('File Serving', 'Serve uploaded files')
    .addServer('https://dev-api.realstate-crm.homes', 'Dev')
    .addServer('http://localhost:3000', 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  // Warn about insecure default credentials in production
  const dbUrl = process.env['DATABASE_URL'] ?? '';
  const isProduction = process.env['NODE_ENV'] === 'production';
  const hasDefaultCreds = dbUrl.includes(':postgres@') || dbUrl.includes(':password@');
  if (isProduction && hasDefaultCreds) {
    console.warn(
      '\n⚠️  WARNING: Database credentials appear to use default/weak values.\n' +
        '   This is a security risk in production. Update POSTGRES_USER and POSTGRES_PASSWORD in your .env file.\n',
    );
  }

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`Real Estate CRM API is running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
}

void bootstrap();
