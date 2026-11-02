import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as sharpModule from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';

const sharp = (sharpModule as any).default || sharpModule;

/**
 * Chuẩn hóa số điện thoại di động Việt Nam:
 * - Loại bỏ toàn bộ khoảng trắng, dấu gạch ngang, dấu chấm
 * - Chuyển đổi định dạng quốc tế (+84 hoặc 84) về chuẩn số di động nội địa (bắt đầu bằng '0', ví dụ: '0976619044')
 */
export function normalizeVietnamesePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

@Injectable()
export class PaymentSettingsService {
  private readonly logger = new Logger(PaymentSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tự động kiểm tra và convert momo-qr.png sang momo-qr.webp nếu có trong thư mục public
   */
  private async ensureMomoWebpConversion(): Promise<string> {
    const possiblePngPaths = [
      path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads', 'payment', 'momo-qr.png'),
      path.resolve(process.cwd(), 'apps', 'frontend', 'public', 'uploads', 'payment', 'momo-qr.png'),
      path.resolve(process.cwd(), 'public', 'uploads', 'payment', 'momo-qr.png'),
      path.resolve(process.cwd(), '..', 'frontend', 'public', 'images', 'momo-qr.png'),
      path.resolve(process.cwd(), 'apps', 'frontend', 'public', 'images', 'momo-qr.png'),
      path.resolve(process.cwd(), 'public', 'images', 'momo-qr.png'),
    ];

    for (const pngPath of possiblePngPaths) {
      if (fs.existsSync(pngPath)) {
        const webpPath = pngPath.replace(/\.png$/, '.webp');
        if (!fs.existsSync(webpPath)) {
          try {
            await sharp(pngPath).webp({ quality: 90 }).toFile(webpPath);
            this.logger.log(`[PaymentSettingsService] Converted ${pngPath} -> ${webpPath}`);
          } catch (err: any) {
            this.logger.warn(`[PaymentSettingsService] Error converting ${pngPath} to WebP: ${err.message}`);
          }
        }
        return '/uploads/payment/momo-qr.webp';
      }
    }

    return '/uploads/payment/momo-qr.webp';
  }

  /**
   * Lấy cấu hình thanh toán hiện tại, nếu chưa có thì khởi tạo bản ghi mặc định
   * Tuyệt đối KHÔNG tự ý ghi đè dữ liệu của admin nếu bản ghi đã tồn tại.
   */
  async getPaymentConfig() {
    await this.ensureMomoWebpConversion();

    let config = await this.prisma.paymentConfig.findUnique({
      where: { id: 'default' },
    });

    const defaultMomoPhone = process.env.MOMO_RECEIVER_PHONE || '0976619044';
    const defaultMomoName = process.env.MOMO_RECEIVER_NAME || 'CONG NGUYEN MACHINERY';

    if (!config) {
      config = await this.prisma.paymentConfig.create({
        data: {
          id: 'default',
          bankId: 'TPB',
          bankName: 'TPBank (Ngân hàng Tiên Phong)',
          accountNumber: '1029384756',
          accountHolder: 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
          isBankEnabled: true,
          momoPhone: defaultMomoPhone,
          momoName: defaultMomoName,
          momoQrUrl: '/uploads/payment/momo-qr.webp',
          isMomoEnabled: true,
        },
      });
    } else if (config.momoQrUrl && (config.momoQrUrl.includes('momo-qr.png') || config.momoQrUrl === '/images/momo-qr.webp')) {
      // Tự động nâng cấp đường dẫn sang /uploads/payment/momo-qr.webp trong database
      config = await this.prisma.paymentConfig.update({
        where: { id: 'default' },
        data: {
          momoQrUrl: '/uploads/payment/momo-qr.webp',
        },
      });
      this.logger.log('[PaymentSettingsService] Updated DB momoQrUrl to /uploads/payment/momo-qr.webp');
    }

    return {
      ...config,
      bankId: 'TPB',
      bankName: 'TPBank (Ngân hàng Tiên Phong)',
      momoQrUrl: config.momoQrUrl ? config.momoQrUrl.replace('.png', '.webp') : '/uploads/payment/momo-qr.webp',
      momoPhone: normalizeVietnamesePhoneNumber(config.momoPhone),
    };
  }

  /**
   * Cập nhật thông tin tài khoản ngân hàng và ví MoMo (chuẩn hóa số điện thoại MoMo & mã QR MoMo tĩnh .webp)
   */
  async updatePaymentConfig(dto: UpdatePaymentConfigDto) {
    this.logger.log(`[PaymentSettingsService] Updating with data: ${JSON.stringify(dto)}`);
    console.log('[PaymentSettingsService] Incoming Payload:', dto);

    const cleanMomoPhone = dto.momoPhone !== undefined ? normalizeVietnamesePhoneNumber(dto.momoPhone) : undefined;

    const result = await this.prisma.paymentConfig.upsert({
      where: { id: 'default' },
      update: {
        bankId: 'TPB',
        bankName: 'TPBank (Ngân hàng Tiên Phong)',
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber.trim() }),
        ...(dto.isBankEnabled !== undefined && { isBankEnabled: dto.isBankEnabled }),
        ...(cleanMomoPhone !== undefined && { momoPhone: cleanMomoPhone }),
        ...(dto.momoName !== undefined && { momoName: dto.momoName ? dto.momoName.trim() : null }),
        ...(dto.momoQrUrl !== undefined && { momoQrUrl: dto.momoQrUrl ? dto.momoQrUrl.trim() : null }),
        ...(dto.isMomoEnabled !== undefined && { isMomoEnabled: dto.isMomoEnabled }),
      },
      create: {
        id: 'default',
        bankId: 'TPB',
        bankName: 'TPBank (Ngân hàng Tiên Phong)',
        accountNumber: dto.accountNumber ? dto.accountNumber.trim() : '',
        accountHolder: 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
        isBankEnabled: dto.isBankEnabled ?? true,
        momoPhone: cleanMomoPhone || process.env.MOMO_RECEIVER_PHONE || '0976619044',
        momoName: dto.momoName ? dto.momoName.trim() : (process.env.MOMO_RECEIVER_NAME || 'CONG NGUYEN MACHINERY'),
        momoQrUrl: dto.momoQrUrl ? dto.momoQrUrl.trim() : '/uploads/payment/momo-qr.webp',
        isMomoEnabled: dto.isMomoEnabled ?? true,
      },
    });

    this.logger.log(`[PaymentSettingsService] Updated record in DB: ${JSON.stringify(result)}`);
    return {
      ...result,
      bankId: 'TPB',
      bankName: 'TPBank (Ngân hàng Tiên Phong)',
      momoQrUrl: result.momoQrUrl ? result.momoQrUrl.replace('.png', '.webp') : '/uploads/payment/momo-qr.webp',
      momoPhone: normalizeVietnamesePhoneNumber(result.momoPhone),
    };
  }
}
