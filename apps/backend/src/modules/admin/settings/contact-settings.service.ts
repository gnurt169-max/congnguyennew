import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateContactSettingsDto } from './dto/contact-settings.dto';

@Injectable()
export class ContactSettingsService {
  private readonly logger = new Logger(ContactSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình thông tin liên hệ hiện tại, nếu chưa có thì khởi tạo bản ghi mặc định
   */
  async getContactSettings() {
    let settings = await this.prisma.contactSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.contactSettings.create({
        data: {
          id: 'default',
          hotline: '0976 619 044',
          zaloPhone: '0976619044',
          facebookUrl: 'https://facebook.com/congnguyenmachinery',
          emailContact: 'hotro@congnguyen.com.vn',
          showroomAddress: '6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam',
        },
      });
    }

    return settings;
  }

  /**
   * Cập nhật thông tin hotline, zalo, facebook, email, địa chỉ showroom
   */
  async updateContactSettings(dto: UpdateContactSettingsDto) {
    this.logger.log(`[ContactSettingsService] Updating with data: ${JSON.stringify(dto)}`);
    console.log('[ContactSettingsService] Incoming Payload:', dto);

    const updated = await this.prisma.contactSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(dto.hotline !== undefined && { hotline: dto.hotline.trim() }),
        ...(dto.zaloPhone !== undefined && { zaloPhone: dto.zaloPhone.trim() }),
        ...(dto.facebookUrl !== undefined && { facebookUrl: dto.facebookUrl.trim() }),
        ...(dto.emailContact !== undefined && { emailContact: dto.emailContact.trim() }),
        ...(dto.showroomAddress !== undefined && { showroomAddress: dto.showroomAddress.trim() }),
      },
      create: {
        id: 'default',
        hotline: dto.hotline?.trim() || '0976 619 044',
        zaloPhone: dto.zaloPhone?.trim() || '0976619044',
        facebookUrl: dto.facebookUrl?.trim() || 'https://facebook.com/congnguyenmachinery',
        emailContact: dto.emailContact?.trim() || 'hotro@congnguyen.com.vn',
        showroomAddress: dto.showroomAddress?.trim() || '6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam',
      },
    });

    this.logger.log(`[ContactSettingsService] Updated record in DB: ${JSON.stringify(updated)}`);
    return updated;
  }
}
