import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateHomepageConfigDto } from './dto/homepage-setting.dto';

export const DEFAULT_HOMEPAGE_CONFIG = {
  badgeText: 'CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG',
  headingText: 'Kho Máy Làm Bánh Công Nghiệp & Máy Làm Bánh Cũ Tân Trang.',
  headingHighlight: 'Chuẩn Kỹ Thuật Tại TP.HCM.',
  description:
    'Công Nguyên chuyên mua bán, tân trang và thanh lý máy làm bánh công nghiệp, máy làm bánh cũ giá tốt tại TP.HCM: lò nướng bánh, máy trộn bột, tủ trưng bày bánh kem... Bảo hành kỹ thuật tận nơi, hỗ trợ chạy thử trực tiếp tại xưởng.',
  primaryCtaText: 'Xem Kho Máy Tân Trang',
  primaryCtaLink: '/products',
  secondaryCtaText: 'Báo Giá Thu Mua Máy Cũ',
  secondaryCtaLink: '/thanh-ly',
  stats: [
    { value: '-50%', label: 'Chi phí so với mua mới' },
    { value: '06 Tháng', label: 'Bảo hành kỹ thuật tận nơi' },
    { value: 'Test Tại Xưởng', label: '6/3 DN4 Đông Hưng Thuận' },
  ],
  featuredImageUrl: '',
  featuredBadgeTag: 'Đã kiểm định kỹ thuật • Độ mới 90-95%',
  featuredCategoryTag: 'TIÊU BIỂU XUẤT XƯỞNG',
  featuredTitle: 'Lò Nướng Đối Lưu & Tủ Bánh Kem Ruyshing',
  featuredStatusTag: 'Sẵn sàng chạy thử',
  founderShow: true,
  founderName: 'Lê Nguyễn Minh Trung',
  founderTitle: 'Kỹ sư / Đại diện Xưởng Máy Công Nguyên',
  founderCommitment: 'Trực tiếp kiểm định từng máy • Đồng hành kỹ thuật 24/7',
  founderAvatarUrl: '',
  founderLine: 'Lê Nguyễn Minh Trung – Trực tiếp kiểm định kỹ thuật & bàn giao máy',
};

@Injectable()
export class HomepageSettingService {
  private readonly logger = new Logger(HomepageSettingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình trang chủ (Hero Section).
   * NGUYÊN TẮC BẢO TOÀN DỮ LIỆU:
   * 1. Chỉ tạo mới nếu bản ghi CHƯA TỒN TẠI trong database.
   * 2. Nếu đã tồn tại dữ liệu do Admin lưu, GIỮ NGUYÊN 100%, tuyệt đối KHÔNG ghi đè lại.
   */
  async getHomepageConfig() {
    let config = await this.prisma.homepageConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      this.logger.log('Bản ghi cấu hình trang chủ chưa tồn tại. Khởi tạo giá trị ban đầu...');
      config = await this.prisma.homepageConfig.create({
        data: {
          id: 'default',
          ...DEFAULT_HOMEPAGE_CONFIG,
        },
      });
    }

    return config;
  }

  /**
   * Cập nhật cấu hình trang chủ (yêu cầu quyền Admin).
   * Dữ liệu mới được cập nhật bền vững vào PostgreSQL trên cùng bản ghi id: 'default'.
   */
  async updateHomepageConfig(dto: UpdateHomepageConfigDto) {
    const dataToUpdate: Record<string, any> = {};

    if (dto.badgeText !== undefined) dataToUpdate.badgeText = dto.badgeText;
    if (dto.headingText !== undefined) dataToUpdate.headingText = dto.headingText;
    if (dto.headingHighlight !== undefined) dataToUpdate.headingHighlight = dto.headingHighlight;
    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.primaryCtaText !== undefined) dataToUpdate.primaryCtaText = dto.primaryCtaText;
    if (dto.primaryCtaLink !== undefined) dataToUpdate.primaryCtaLink = dto.primaryCtaLink;
    if (dto.secondaryCtaText !== undefined) dataToUpdate.secondaryCtaText = dto.secondaryCtaText;
    if (dto.secondaryCtaLink !== undefined) dataToUpdate.secondaryCtaLink = dto.secondaryCtaLink;
    if (dto.stats !== undefined) dataToUpdate.stats = dto.stats;
    if (dto.featuredImageUrl !== undefined) dataToUpdate.featuredImageUrl = dto.featuredImageUrl;
    if (dto.featuredBadgeTag !== undefined) dataToUpdate.featuredBadgeTag = dto.featuredBadgeTag;
    if (dto.featuredCategoryTag !== undefined) dataToUpdate.featuredCategoryTag = dto.featuredCategoryTag;
    if (dto.featuredTitle !== undefined) dataToUpdate.featuredTitle = dto.featuredTitle;
    if (dto.featuredStatusTag !== undefined) dataToUpdate.featuredStatusTag = dto.featuredStatusTag;
    if (dto.founderShow !== undefined) dataToUpdate.founderShow = dto.founderShow;
    if (dto.founderName !== undefined) dataToUpdate.founderName = dto.founderName;
    if (dto.founderTitle !== undefined) dataToUpdate.founderTitle = dto.founderTitle;
    if (dto.founderCommitment !== undefined) dataToUpdate.founderCommitment = dto.founderCommitment;
    if (dto.founderAvatarUrl !== undefined) dataToUpdate.founderAvatarUrl = dto.founderAvatarUrl;
    if (dto.founderLine !== undefined) dataToUpdate.founderLine = dto.founderLine;

    const updated = await this.prisma.homepageConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...DEFAULT_HOMEPAGE_CONFIG,
        ...dataToUpdate,
      },
      update: dataToUpdate,
    });

    this.logger.log('Đã cập nhật cấu hình trang chủ thành công vào PostgreSQL.');
    return updated;
  }

  /**
   * Khôi phục toàn bộ cấu hình về giá trị mặc định của xưởng Công Nguyên
   */
  async resetHomepageConfig() {
    const updated = await this.prisma.homepageConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...DEFAULT_HOMEPAGE_CONFIG,
      },
      update: {
        ...DEFAULT_HOMEPAGE_CONFIG,
      },
    });

    this.logger.log('Đã khôi phục cấu hình trang chủ về mặc định.');
    return updated;
  }
}
