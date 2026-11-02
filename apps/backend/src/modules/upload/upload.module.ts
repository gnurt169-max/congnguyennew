import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AdminUploadController, PublicUploadController } from './upload.controller';
import { AdminAuthGuard } from '../admin/auth/admin-auth.guard';

@Module({
  controllers: [AdminUploadController, PublicUploadController],
  providers: [UploadService, AdminAuthGuard],
  exports: [UploadService],
})
export class UploadModule {}

