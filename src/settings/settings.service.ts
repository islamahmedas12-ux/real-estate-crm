import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<Prisma.JsonValue> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value ?? {};
  }

  async set(key: string, value: Prisma.InputJsonValue): Promise<Prisma.JsonValue> {
    const result = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return result.value;
  }
}
