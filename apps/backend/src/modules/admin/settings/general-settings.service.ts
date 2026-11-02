import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBrandSettingsDto } from './dto/brand-settings.dto';
import { UpdateAdminMenuLabelDto } from './dto/admin-menu-labels.dto';

export const DEFAULT_GENERAL_SETTINGS = {
  brandName: 'CÔNG NGUYÊN',
  brandTagline: 'Giải Pháp Máy Làm Bánh Công Nghiệp',
  brandLogoText: 'CN',
  seoTitle: 'Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM',
  seoDescription:
    'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.',
};

export const DEFAULT_ADMIN_MENU_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan Dashboard',
  quotations: 'Báo giá kỹ thuật B2B (RFQ)',
  products_module: 'Kho máy tân trang',
  orders: 'Đơn hàng & Thu cọc máy',
  settings_brand: 'Cài đặt Thương hiệu',
  settings_payment: 'Cài đặt Thanh toán',
  settings_contact: 'Thông tin Liên hệ',
  settings_content: 'Nội dung Website',
  settings_homepage: 'Hero & Trang chủ',
  settings_visibility: 'Hiển thị giao diện',
  settings_navigation: 'Menu Header',
  settings_gemini: 'Cấu hình AI Gemini',
  settings_security: 'Bảo mật & Đổi mật khẩu',
};

@Injectable()
export class GeneralSettingsService {
  private readonly logger = new Logger(GeneralSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình thương hiệu & chung (Brand Identity).
   * NGUYÊN TẮC:
   * - Chỉ tạo mới nếu bản ghi CHƯA TỒN TẠI trong database.
   * - Nếu đã tồn tại dữ liệu do Admin lưu, GIỮ NGUYÊN 100%, không ghi đè khi restart server.
   */
  async getGeneralSettings() {
    let settings = await this.prisma.generalSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      this.logger.log('Cấu hình Brand Identity chưa tồn tại. Khởi tạo bản ghi mặc định...');
      settings = await this.prisma.generalSettings.create({
        data: {
          id: 'default',
          ...DEFAULT_GENERAL_SETTINGS,
        },
      });
    }

    return settings;
  }

  /**
   * Cập nhật thông tin thương hiệu
   */
  async updateBrandSettings(dto: UpdateBrandSettingsDto) {
    const updateData: {
      brandName?: string;
      brandTagline?: string;
      brandLogoText?: string;
      seoTitle?: string;
      seoDescription?: string;
    } = {};

    if (dto.brandName !== undefined) {
      updateData.brandName = dto.brandName.trim();
    }
    if (dto.brandTagline !== undefined) {
      updateData.brandTagline = dto.brandTagline.trim();
    }
    if (dto.brandLogoText !== undefined) {
      updateData.brandLogoText = dto.brandLogoText.trim();
    }
    if (dto.seoTitle !== undefined) {
      updateData.seoTitle = dto.seoTitle.trim();
    }
    if (dto.seoDescription !== undefined) {
      updateData.seoDescription = dto.seoDescription.trim();
    }

    const updated = await this.prisma.generalSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        brandName: dto.brandName?.trim() || DEFAULT_GENERAL_SETTINGS.brandName,
        brandTagline: dto.brandTagline?.trim() || DEFAULT_GENERAL_SETTINGS.brandTagline,
        brandLogoText: dto.brandLogoText?.trim() || DEFAULT_GENERAL_SETTINGS.brandLogoText,
        seoTitle: dto.seoTitle?.trim() || DEFAULT_GENERAL_SETTINGS.seoTitle,
        seoDescription: dto.seoDescription?.trim() || DEFAULT_GENERAL_SETTINGS.seoDescription,
      },
    });

    // Đồng bộ đồng thời vào bảng site_settings
    try {
      await this.prisma.siteSetting.upsert({
        where: { id: 'default' },
        update: updateData,
        create: {
          id: 'default',
          brandName: dto.brandName?.trim() || DEFAULT_GENERAL_SETTINGS.brandName,
          brandTagline: dto.brandTagline?.trim() || DEFAULT_GENERAL_SETTINGS.brandTagline,
          brandLogoText: dto.brandLogoText?.trim() || DEFAULT_GENERAL_SETTINGS.brandLogoText,
          seoTitle: dto.seoTitle?.trim() || DEFAULT_GENERAL_SETTINGS.seoTitle,
          seoDescription: dto.seoDescription?.trim() || DEFAULT_GENERAL_SETTINGS.seoDescription,
        },
      });
    } catch {}

    this.logger.log(`Đã cập nhật thông tin thương hiệu: ${JSON.stringify(updated)}`);
    return updated;
  }

  /**
   * Khôi phục cài đặt mặc định
   */
  async resetBrandSettings() {
    return this.prisma.generalSettings.upsert({
      where: { id: 'default' },
      update: { ...DEFAULT_GENERAL_SETTINGS },
      create: {
        id: 'default',
        ...DEFAULT_GENERAL_SETTINGS,
      },
    });
  }

  /**
   * Lấy cấu hình nhãn menu thanh Sidebar Admin
   */
  async getAdminMenuLabels(): Promise<Record<string, string>> {
    const settings = await this.getGeneralSettings();
    const stored = (settings.adminMenuLabels as Record<string, string>) || {};
    return {
      ...DEFAULT_ADMIN_MENU_LABELS,
      ...stored,
    };
  }

  /**
   * Cập nhật nhãn menu thanh Sidebar Admin (Inline Editing)
   * Nhận key + label và lưu bền vững vào database PostgreSQL
   */
  async updateAdminMenuLabels(dto: UpdateAdminMenuLabelDto): Promise<Record<string, string>> {
    const current = await this.getAdminMenuLabels();
    const updated = { ...current };

    if (dto.key && dto.label) {
      updated[dto.key.trim()] = dto.label.trim();
    }

    if (dto.labels && typeof dto.labels === 'object') {
      Object.assign(updated, dto.labels);
    }

    if (dto.products_module) {
      updated['products_module'] = dto.products_module.trim();
    }

    await this.prisma.generalSettings.upsert({
      where: { id: 'default' },
      update: {
        adminMenuLabels: updated,
      },
      create: {
        id: 'default',
        ...DEFAULT_GENERAL_SETTINGS,
        adminMenuLabels: updated,
      },
    });

    this.logger.log(`Đã cập nhật nhãn menu Admin Sidebar: ${JSON.stringify(updated)}`);
    return updated;
  }

  /**
   * Khôi phục nhãn menu mặc định (theo key hoặc toàn bộ)
   */
  async resetAdminMenuLabels(key?: string): Promise<Record<string, string>> {
    const current = await this.getAdminMenuLabels();
    let updated: Record<string, string>;

    if (key && DEFAULT_ADMIN_MENU_LABELS[key]) {
      updated = {
        ...current,
        [key]: DEFAULT_ADMIN_MENU_LABELS[key],
      };
    } else {
      updated = { ...DEFAULT_ADMIN_MENU_LABELS };
    }

    await this.prisma.generalSettings.update({
      where: { id: 'default' },
      data: {
        adminMenuLabels: updated,
      },
    });

    return updated;
  }
}

