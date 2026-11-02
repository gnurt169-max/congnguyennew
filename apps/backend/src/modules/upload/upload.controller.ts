import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, ProcessedImageResult } from './upload.service';
import { AdminAuthGuard } from '../admin/auth/admin-auth.guard';
import * as multer from 'multer';

@Controller('admin/upload')
@UseGuards(AdminAuthGuard)
export class AdminUploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/v1/admin/upload
   * Nhận file multipart (field 'file') hoặc JSON Base64 (field 'imageBase64' hoặc 'data')
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { data?: string; imageBase64?: string; filename?: string; mimeType?: string },
  ): Promise<ProcessedImageResult> {
    if (file) {
      return this.uploadService.processImage(file.buffer, file.originalname, file.mimetype);
    }

    const base64Data = body?.data || body?.imageBase64;
    if (base64Data) {
      return this.uploadService.processBase64(base64Data, body?.filename, body?.mimeType);
    }

    throw new BadRequestException('Vui lòng chọn file hình ảnh hoặc truyền chuỗi Base64 hợp lệ');
  }
}

@Controller('upload')
export class PublicUploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/v1/upload
   * Endpoint public hỗ trợ upload ảnh với chuyển đổi WebP
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { data?: string; imageBase64?: string; filename?: string; mimeType?: string },
  ): Promise<ProcessedImageResult> {
    if (file) {
      return this.uploadService.processImage(file.buffer, file.originalname, file.mimetype);
    }

    const base64Data = body?.data || body?.imageBase64;
    if (base64Data) {
      return this.uploadService.processBase64(base64Data, body?.filename, body?.mimeType);
    }

    throw new BadRequestException('Vui lòng chọn file hình ảnh hoặc truyền chuỗi Base64 hợp lệ');
  }
}

