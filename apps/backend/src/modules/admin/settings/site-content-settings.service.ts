import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSiteContentSettingsDto } from './dto/site-content-settings.dto';

const DEFAULT_FEATURED_LINKS = [
  { label: 'Tủ trưng bày bánh kem & Bảo quản', url: '/products?categorySlug=tu-trung-bay-banh' },
  { label: 'Lò nướng bánh công nghiệp', url: '/products?categorySlug=lo-nuong-cong-nghiep' },
  { label: 'Máy trộn bột & Cối đánh trứng', url: '/products?categorySlug=may-tron-bot-danh-trung' },
  { label: 'Dịch vụ Thu mua máy làm bánh cũ', url: '/thu-mua-may-cu' },
  { label: 'Tra cứu tiến độ kỹ thuật & Đơn hàng', url: '/tra-cuu-tien-do' },
];

@Injectable()
export class SiteContentSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình nội dung website hiện tại, nếu chưa có thì khởi tạo bản ghi mặc định
   */
  async getSiteContentSettings() {
    let settings = await this.prisma.siteContentSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.siteContentSettings.create({
        data: {
          id: 'default',
          bannerTitle: 'Tư Vấn & Khảo Sát Dây Chuyền Bánh Tận Nơi',
          bannerSubtitle:
            'Đội ngũ kỹ thuật hỗ trợ tính toán công suất lò nướng, máy trộn và kiểm tra hạ tầng điện 3 pha cho xưởng của bạn.',
          bannerButtonText: 'Gửi yêu cầu tư vấn kỹ thuật (RFQ)',
          bannerButtonLink: '/rfq',
          bannerHotline: '0976 619 044',
          footerCompanyName: 'CÔNG NGUYÊN',
          footerSlogan: 'THIẾT BỊ BÁNH THANH LÝ & TÂN TRANG',
          footerDescription:
            'Công Nguyên chuyên thu mua, tân trang và thanh lý thiết bị làm bánh công nghiệp chất lượng cao tại TP.HCM. Cam kết máy móc nguyên bản, kỹ thuật kiểm định chuẩn xưởng, bảo hành tận tâm và giá thành tối ưu cho chủ tiệm bánh.',
          footerCopyright:
            '© 2026 CÔNG NGUYÊN - congnguyen.com.vn. Thiết bị làm bánh thanh lý & tân trang hàng đầu TP.HCM.',
          featuredLinks: DEFAULT_FEATURED_LINKS,
        },
      });
    }

    return settings;
  }

  /**
   * Cập nhật cấu hình nội dung website
   */
  async updateSiteContentSettings(dto: UpdateSiteContentSettingsDto) {
    return this.prisma.siteContentSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(dto.bannerTitle !== undefined && { bannerTitle: dto.bannerTitle.trim() }),
        ...(dto.bannerSubtitle !== undefined && { bannerSubtitle: dto.bannerSubtitle.trim() }),
        ...(dto.bannerButtonText !== undefined && { bannerButtonText: dto.bannerButtonText.trim() }),
        ...(dto.bannerButtonLink !== undefined && { bannerButtonLink: dto.bannerButtonLink.trim() }),
        ...(dto.bannerHotline !== undefined && { bannerHotline: dto.bannerHotline.trim() }),
        ...(dto.footerCompanyName !== undefined && { footerCompanyName: dto.footerCompanyName.trim() }),
        ...(dto.footerSlogan !== undefined && { footerSlogan: dto.footerSlogan.trim() }),
        ...(dto.footerDescription !== undefined && { footerDescription: dto.footerDescription.trim() }),
        ...(dto.footerCopyright !== undefined && { footerCopyright: dto.footerCopyright.trim() }),
        ...(dto.featuredLinks !== undefined && { featuredLinks: dto.featuredLinks as any }),
      },
      create: {
        id: 'default',
        bannerTitle: dto.bannerTitle?.trim() || 'Tư Vấn & Khảo Sát Dây Chuyền Bánh Tận Nơi',
        bannerSubtitle:
          dto.bannerSubtitle?.trim() ||
          'Đội ngũ kỹ thuật hỗ trợ tính toán công suất lò nướng, máy trộn và kiểm tra hạ tầng điện 3 pha cho xưởng của bạn.',
        bannerButtonText: dto.bannerButtonText?.trim() || 'Gửi yêu cầu tư vấn kỹ thuật (RFQ)',
        bannerButtonLink: dto.bannerButtonLink?.trim() || '/rfq',
        bannerHotline: dto.bannerHotline?.trim() || '0976 619 044',
        footerCompanyName: dto.footerCompanyName?.trim() || 'CÔNG NGUYÊN',
        footerSlogan: dto.footerSlogan?.trim() || 'THIẾT BỊ BÁNH THANH LÝ & TÂN TRANG',
        footerDescription:
          dto.footerDescription?.trim() ||
          'Công Nguyên chuyên thu mua, tân trang và thanh lý thiết bị làm bánh công nghiệp chất lượng cao tại TP.HCM. Cam kết máy móc nguyên bản, kỹ thuật kiểm định chuẩn xưởng, bảo hành tận tâm và giá thành tối ưu cho chủ tiệm bánh.',
        footerCopyright:
          dto.footerCopyright?.trim() ||
          '© 2026 CÔNG NGUYÊN - congnguyen.com.vn. Thiết bị làm bánh thanh lý & tân trang hàng đầu TP.HCM.',
        featuredLinks: (dto.featuredLinks as any) || DEFAULT_FEATURED_LINKS,
      },
    });
  }
}
