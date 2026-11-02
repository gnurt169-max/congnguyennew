import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as sharpModule from 'sharp';
import type { Metadata, OutputInfo } from 'sharp';

// Đảm bảo tương thích hoàn hảo giữa ESModule và CommonJS runtime của Node/NestJS
const sharp = (sharpModule as any).default || sharpModule;

function findProjectRootDir(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (
      fs.existsSync(path.join(curr, 'apps', 'frontend', 'public')) &&
      fs.existsSync(path.join(curr, 'package.json'))
    ) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  curr = __dirname;
  for (let i = 0; i < 6; i++) {
    if (
      fs.existsSync(path.join(curr, 'apps', 'frontend', 'public')) &&
      fs.existsSync(path.join(curr, 'package.json'))
    ) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

export interface ProcessedImageResult {
  success: boolean;
  url: string;
  fileName: string;
  originalSize: number;
  optimizedSize: number;
  savedPercent: string;
  width?: number;
  height?: number;
  format: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Tìm chính xác thư mục lưu trữ ảnh tĩnh Next.js: apps/frontend/public/uploads/...
   */
  private resolveUploadSubDir(subFolder: 'products' | 'branding' | 'payment' = 'products'): string {
    const rootDir = findProjectRootDir();
    const primary = path.join(rootDir, 'apps', 'frontend', 'public', 'uploads', subFolder);
    if (!fs.existsSync(primary)) {
      try {
        fs.mkdirSync(primary, { recursive: true, mode: 0o755 });
      } catch {}
    }
    return primary;
  }

  constructor() {
    this.resolveUploadSubDir('products');
    this.resolveUploadSubDir('branding');
    this.resolveUploadSubDir('payment');
  }

  /**
   * Xử lý file ảnh nhị phân: Resize, nén và chuyển đổi sang định dạng .webp
   * - Giới hạn width tối đa: 1400px (withoutEnlargement: true)
   * - Định dạng: WebP chất lượng 80, effort 4
   * - Lưu trực tiếp vào apps/frontend/public/uploads/products/ (hoặc payment/)
   */
  async processImage(
    buffer: Buffer,
    originalFilename?: string,
    mimeType?: string,
    tempFilePath?: string,
  ): Promise<ProcessedImageResult> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException('Dữ liệu ảnh tải lên không được để trống');
      }

      if (buffer.length > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Dung lượng ảnh ${(buffer.length / 1024 / 1024).toFixed(1)}MB vượt quá giới hạn 20MB. Vui lòng chọn ảnh nhỏ hơn.`,
        );
      }

      // 1. Kiểm tra an toàn tính toàn vẹn và định dạng bằng Sharp
      let metadata: Metadata;
      try {
        metadata = await sharp(buffer).metadata();
      } catch (err: any) {
        this.logger.error(`Lỗi đọc metadata ảnh: ${err.message}`);
        throw new BadRequestException('File ảnh tải lên không hợp lệ hoặc dữ liệu bị hỏng.');
      }

      const format = metadata.format?.toLowerCase();
      if (!format || !['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
        throw new BadRequestException(
          `Định dạng ảnh "${format || mimeType || 'không xác định'}" không được hỗ trợ. Chỉ chấp nhận ảnh JPG, JPEG, PNG, WEBP.`,
        );
      }

      const originalSize = buffer.length;

      // 2. Chuyển đổi và tối ưu hoá WebP với Sharp
      let optimizedBuffer: Buffer;
      let outputMetadata: OutputInfo;
      try {
        const pipeline = sharp(buffer)
          .rotate() // Tự động xoay theo EXIF orientation của ảnh chụp điện thoại
          .resize({
            width: 1400,
            withoutEnlargement: true, // Giữ nguyên tỉ lệ gốc nếu ảnh nhỏ hơn 1400px
            fit: 'inside',
          })
          .webp({
            quality: 80,
            effort: 4, // Tỉ lệ nén / tốc độ tối ưu theo yêu cầu
          });

        const result = await pipeline.toBuffer({ resolveWithObject: true });
        optimizedBuffer = result.data;
        outputMetadata = result.info;
      } catch (err: any) {
        this.logger.error(`Lỗi tối ưu hoá WebP qua Sharp: ${err.message}`);
        throw new BadRequestException('Có lỗi xảy ra trong quá trình nén và tối ưu hoá ảnh WebP.');
      }

      const optimizedSize = optimizedBuffer.length;
      const savedPercent =
        originalSize > 0
          ? (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1)
          : '0.0';

      // 3. Đặt tên file thân thiện SEO có đuôi .webp
      const baseSlug = (originalFilename || 'may-lam-banh')
        .replace(/\.[^/.]+$/, '') // bỏ đuôi cũ
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
        .replace(/[^a-z0-9_-]/g, '-') // thay ký tự đặc biệt
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 40) || 'product-img';

      const isBranding =
        baseSlug.includes('logo') ||
        baseSlug.includes('avatar') ||
        baseSlug.includes('founder') ||
        baseSlug.includes('brand') ||
        baseSlug.includes('favicon') ||
        baseSlug.includes('congnguyen');

      const isPaymentQr =
        baseSlug.includes('momo') ||
        baseSlug.includes('vietqr') ||
        baseSlug.includes('payment') ||
        baseSlug.includes('qr');

      let subFolder: 'products' | 'branding' | 'payment' = 'products';
      if (isBranding || isPaymentQr) {
        subFolder = 'branding';
      }

      const targetDir = this.resolveUploadSubDir(subFolder);

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const fileName = `${baseSlug}-${timestamp}-${randomSuffix}.webp`;
      const filePath = path.join(targetDir, fileName);

      // 4. Lưu trực tiếp file WebP vào thư mục apps/frontend/public/uploads/products/ hoặc branding/
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true, mode: 0o755 });
        }
        await fs.promises.writeFile(filePath, optimizedBuffer, { mode: 0o644 });

        // Nếu là QR thanh toán, đồng bộ thêm sang uploads/payment/ để duy trì tương thích URL cũ
        if (isPaymentQr) {
          const paymentDir = this.resolveUploadSubDir('payment');
          await fs.promises.writeFile(path.join(paymentDir, fileName), optimizedBuffer, { mode: 0o644 });
        }
      } catch (err: any) {
        this.logger.error(`Lỗi ghi file WebP vào ổ cứng: ${err.message}`);
        throw new BadRequestException('Không thể lưu file ảnh vào máy chủ.');
      }

      const publicUrl = `/uploads/${subFolder}/${fileName}`;

      // 5. Ghi log dung lượng trước / sau khi nén để xác nhận hiệu quả
      this.logger.log(
        `📸 [Sharp WebP] Lưu vào ${filePath} -> "${publicUrl}" | Dung lượng: ${(originalSize / 1024).toFixed(1)} KB -> ${(optimizedSize / 1024).toFixed(1)} KB (Giảm ${savedPercent}%) | Độ phân giải: ${outputMetadata.width}x${outputMetadata.height}px`,
      );

      return {
        success: true,
        url: publicUrl,
        fileName,
        originalSize,
        optimizedSize,
        savedPercent,
        width: outputMetadata.width,
        height: outputMetadata.height,
        format: 'webp',
      };
    } finally {
      // Dọn dẹp file tạm nếu dùng diskStorage
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          this.logger.warn(`Không thể xóa file tạm ${tempFilePath}: ${e}`);
        }
      }
    }
  }

  /**
   * Xử lý ảnh dạng Base64
   */
  async processBase64(
    base64String: string,
    filename?: string,
    mimeType?: string,
  ): Promise<ProcessedImageResult> {
    if (!base64String || typeof base64String !== 'string') {
      throw new BadRequestException('Dữ liệu ảnh base64 không hợp lệ');
    }

    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let detectedMime = mimeType;

    if (matches && matches.length === 3) {
      detectedMime = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64String, 'base64');
    }

    return this.processImage(buffer, filename, detectedMime);
  }
}
