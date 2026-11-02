import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateVisibilityDto } from './dto/visibility-setting.dto';

export const DEFAULT_VISIBILITY = {
  showBadge: true,
  showHeroStats: true,
  showHeroFeaturedCard: true,
  showSecondaryCTA: true,
  showFloatingContact: true,
  showWorkshopLocation: false,
  showHotProductsSection: true,
  showTestimonials: true,
};

@Injectable()
export class VisibilitySettingService {
  private readonly logger = new Logger(VisibilitySettingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình hiển thị các vùng giao diện
   */
  async getVisibility() {
    let visibility = await this.prisma.sectionVisibility.findUnique({
      where: { id: 'default' },
    });

    if (!visibility) {
      this.logger.log('Khởi tạo cấu hình hiển thị mặc định (toàn bộ hiển thị: true)...');
      visibility = await this.prisma.sectionVisibility.create({
        data: {
          id: 'default',
          ...DEFAULT_VISIBILITY,
        },
      });
    }

    return visibility;
  }

  /**
   * Cập nhật trạng thái hiển thị (yêu cầu Admin)
   */
  async updateVisibility(dto: UpdateVisibilityDto) {
    const dataToUpdate: Record<string, boolean> = {};

    if (dto.showBadge !== undefined) dataToUpdate.showBadge = dto.showBadge;
    if (dto.showHeroStats !== undefined) dataToUpdate.showHeroStats = dto.showHeroStats;
    if (dto.showHeroFeaturedCard !== undefined) dataToUpdate.showHeroFeaturedCard = dto.showHeroFeaturedCard;
    if (dto.showSecondaryCTA !== undefined) dataToUpdate.showSecondaryCTA = dto.showSecondaryCTA;
    if (dto.showFloatingContact !== undefined) dataToUpdate.showFloatingContact = dto.showFloatingContact;
    if (dto.showWorkshopLocation !== undefined) dataToUpdate.showWorkshopLocation = dto.showWorkshopLocation;
    if (dto.showHotProductsSection !== undefined) dataToUpdate.showHotProductsSection = dto.showHotProductsSection;
    if (dto.showTestimonials !== undefined) dataToUpdate.showTestimonials = dto.showTestimonials;

    const updated = await this.prisma.sectionVisibility.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...DEFAULT_VISIBILITY,
        ...dataToUpdate,
      },
      update: dataToUpdate,
    });

    // Đồng bộ vào homepageConfig.homepageVisibility dạng JSON dự phòng
    try {
      await this.prisma.homepageConfig.updateMany({
        where: { id: 'default' },
        data: {
          homepageVisibility: updated as any,
        },
      });
    } catch (err) {
      this.logger.warn('Không thể đồng bộ vào homepageConfig:', err);
    }

    this.logger.log('Đã cập nhật trạng thái hiển thị vùng giao diện thành công vào PostgreSQL.');
    return updated;
  }

  /**
   * Khôi phục tất cả trạng thái hiển thị về mặc định (toàn bộ bật: true)
   */
  async resetVisibility() {
    const updated = await this.prisma.sectionVisibility.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...DEFAULT_VISIBILITY,
      },
      update: {
        ...DEFAULT_VISIBILITY,
      },
    });

    try {
      await this.prisma.homepageConfig.updateMany({
        where: { id: 'default' },
        data: {
          homepageVisibility: updated as any,
        },
      });
    } catch {}

    this.logger.log('Đã khôi phục toàn bộ trạng thái hiển thị về mặc định.');
    return updated;
  }
}
