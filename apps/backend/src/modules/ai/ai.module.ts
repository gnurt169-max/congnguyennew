import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAdminController } from './ai-admin.controller';
import { AiPublicController } from './ai-public.controller';
import { AdminAuthGuard } from '../admin/auth/admin-auth.guard';
import { AdminAuthService } from '../admin/auth/admin-auth.service';

@Module({
  controllers: [AiAdminController, AiPublicController],
  providers: [AiService, AdminAuthGuard, AdminAuthService],
  exports: [AiService],
})
export class AiModule {}
