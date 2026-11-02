import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseSyncService } from './database-sync.service';

@Global()
@Module({
  providers: [PrismaService, DatabaseSyncService],
  exports: [PrismaService, DatabaseSyncService],
})
export class PrismaModule {}
