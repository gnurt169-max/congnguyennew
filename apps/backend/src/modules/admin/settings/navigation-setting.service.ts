import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateNavigationSettingsDto, NavigationItemDto } from './dto/navigation-setting.dto';

export const DEFAULT_NAVIGATION_ITEMS: NavigationItemDto[] = [
  {
    id: 'menu_inventory',
    label: 'Kho máy thanh lý & tân trang',
    url: '/products',
    badge: null,
    order: 1,
    isVisible: true,
  },
  {
    id: 'menu_buyback',
    label: 'Thu mua máy cũ',
    url: '/thanh-ly',
    badge: 'HOT',
    order: 2,
    isVisible: true,
  },
  {
    id: 'menu_tracking',
    label: 'Tra cứu tiến độ',
    url: '/tracking',
    badge: null,
    order: 3,
    isVisible: true,
  },
  {
    id: 'menu_rfq',
    label: 'Báo giá nhanh (RFQ)',
    url: '/rfq',
    badge: 'NEW',
    order: 4,
    isVisible: true,
  },
];

@Injectable()
export class NavigationSettingService {
  private readonly logger = new Logger(NavigationSettingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách menu điều hướng Header
   * NGUYÊN TẮC BẢO TOÀN DỮ LIỆU: Nếu đã có trong DB thì giữ nguyên 100%, không ghi đè khi restart server.
   */
  async getNavigationSettings() {
    let settings = await this.prisma.navigationSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      this.logger.log('Khởi tạo danh sách menu điều hướng Header mặc định...');
      settings = await this.prisma.navigationSettings.create({
        data: {
          id: 'default',
          items: DEFAULT_NAVIGATION_ITEMS as any,
        },
      });
    }

    // Đảm bảo trả về mảng items hợp lệ và đã sắp xếp theo order
    const rawItems = Array.isArray(settings.items) ? settings.items : DEFAULT_NAVIGATION_ITEMS;
    const sorted = [...rawItems]
      .map((item: any, index) => {
        const labelText = (item.label || item.title || '').trim();
        const urlText = (item.url || item.href || '').trim();
        const visible = item.isVisible !== undefined ? item.isVisible : (item.isActive !== undefined ? item.isActive : true);
        return {
          id: item.id || `menu_${index}`,
          label: labelText,
          title: labelText,
          url: urlText,
          badge: item.badge ? item.badge.trim() : null,
          order: item.order !== undefined && item.order !== null ? Number(item.order) : index + 1,
          isVisible: visible,
          isActive: visible,
          isOpenNewTab: Boolean(item.isOpenNewTab),
        };
      })
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return {
      id: settings.id,
      items: sorted,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Cập nhật danh sách menu điều hướng Header (Yêu cầu quyền Admin)
   */
  async updateNavigationSettings(dto: UpdateNavigationSettingsDto) {
    // Chuẩn hóa và gán order tuần tự nếu chưa có
    const normalizedItems = dto.items.map((item, index) => {
      const labelText = (item.label || item.title || '').trim();
      const urlText = (item.url || item.href || '').trim();
      const visible = item.isVisible !== undefined ? item.isVisible : (item.isActive !== undefined ? item.isActive : true);
      return {
        id: item.id || `menu_${Date.now()}_${index}`,
        label: labelText,
        title: labelText,
        url: urlText,
        badge: item.badge ? item.badge.trim() : null,
        order: item.order !== undefined && item.order !== null ? Number(item.order) : index + 1,
        isVisible: visible,
        isActive: visible,
        isOpenNewTab: Boolean(item.isOpenNewTab),
      };
    });

    const sortedItems = [...normalizedItems].sort((a, b) => a.order - b.order);

    const updated = await this.prisma.navigationSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        items: sortedItems as any,
      },
      update: {
        items: sortedItems as any,
      },
    });

    this.logger.log(`Đã cập nhật ${sortedItems.length} mục menu Header vào PostgreSQL thành công.`);

    return {
      id: updated.id,
      items: sortedItems,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Khôi phục danh sách menu điều hướng Header về mặc định ban đầu
   */
  async resetNavigationSettings() {
    const updated = await this.prisma.navigationSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        items: DEFAULT_NAVIGATION_ITEMS as any,
      },
      update: {
        items: DEFAULT_NAVIGATION_ITEMS as any,
      },
    });

    this.logger.log('Đã khôi phục danh sách menu Header về mặc định.');

    return {
      id: updated.id,
      items: DEFAULT_NAVIGATION_ITEMS,
      updatedAt: updated.updatedAt,
    };
  }
}

