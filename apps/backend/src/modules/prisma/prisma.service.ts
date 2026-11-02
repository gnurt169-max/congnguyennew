import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('PrismaSlowQuery');

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // Lắng nghe sự kiện query: nếu duration > 100ms, in cảnh báo phát hiện điểm nghẽn
    // @ts-ignore
    this.$on('query', (event: Prisma.QueryEvent) => {
      if (event.duration > 100) {
        this.logger.warn(
          `[SLOW QUERY ${event.duration}ms]: ${event.query} -- Params: ${event.params}`,
        );
      }
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
