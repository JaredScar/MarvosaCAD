import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const file = join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
    super({ datasources: { db: { url: `file:${file}` } } });
  }

  async onModuleInit() {
    await this.$connect();
    const users = await this.user.count();
    if (users === 0) {
      this.logger.warn('Database has no users. From the api folder run: npm run db:setup');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
