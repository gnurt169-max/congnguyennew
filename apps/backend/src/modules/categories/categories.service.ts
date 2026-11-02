import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export function slugifyVietnamese(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const STANDARD_BAKERY_CATEGORIES = [
  {
    name: 'Tủ trưng bày bánh kem & Bảo quản',
    slug: 'tu-trung-bay-banh',
    description: 'Tủ trưng bày bánh kem 1m5, 1m8 5 tầng kính sấy, tủ mát cánh lùa, tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    sortOrder: 1,
  },
  {
    name: 'Lò nướng bánh công nghiệp',
    slug: 'lo-nuong-cong-nghiep',
    description: 'Lò nướng đối lưu Southstar 4 mâm, lò nướng điện Hewwu, lò đối lưu công nghiệp',
    sortOrder: 2,
  },
  {
    name: 'Máy trộn bột & Đánh trứng',
    slug: 'may-tron-bot-danh-trung',
    description: 'Cối đánh trứng / nhào bột Hobat Đài Loan, máy trộn bột xoắn ốc Spiral, máy nhào bột công nghiệp',
    sortOrder: 3,
  },
  {
    name: 'Thiết bị tạo hình & Phụ trợ',
    slug: 'thiet-bi-phu-tro',
    description: 'Máy chia vê bột, máy cán bột 2 chiều, xe đẩy khay inox và phụ kiện dây chuyền làm bánh',
    sortOrder: 4,
  },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  /**
   * Đảm bảo 4 danh mục chuẩn cho ngành máy làm bánh của Công Nguyên luôn tồn tại trong DB
   */
  async ensureStandardCategories() {
    for (const item of STANDARD_BAKERY_CATEGORIES) {
      const existing = await this.repository.findBySlug(item.slug);
      if (!existing) {
        const existingByName = await this.repository.findByName(item.name);
        if (!existingByName) {
          try {
            await this.repository.create({
              name: item.name,
              slug: item.slug,
              description: item.description,
              sortOrder: item.sortOrder,
              isActive: true,
            });
          } catch {
            // Tránh conflict song song
          }
        }
      }
    }
  }

  /**
   * Lấy danh mục mặc định khi sản phẩm chưa được phân loại
   */
  async getDefaultCategory() {
    await this.ensureStandardCategories();
    const defaultCat =
      (await this.repository.findBySlug('thiet-bi-phu-tro')) ||
      (await this.repository.findBySlug('tu-trung-bay-banh')) ||
      (await this.repository.findBySlug(STANDARD_BAKERY_CATEGORIES[0].slug));

    if (defaultCat) return defaultCat;

    const all = await this.repository.findAll();
    if (all.length > 0) return all[0];

    return this.repository.create({
      name: STANDARD_BAKERY_CATEGORIES[0].name,
      slug: STANDARD_BAKERY_CATEGORIES[0].slug,
      description: STANDARD_BAKERY_CATEGORIES[0].description,
      sortOrder: 1,
      isActive: true,
    });
  }

  /**
   * Tìm danh mục linh hoạt theo ID, Slug hoặc Tên
   */
  async findCategoryByIdOrSlugOrName(identifier: string) {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    // 1. Thử tìm theo ID
    const byId = await this.repository.findById(trimmed);
    if (byId) return byId;

    // 2. Thử tìm theo Slug
    const bySlug = await this.repository.findBySlug(trimmed);
    if (bySlug) return bySlug;

    // 3. Thử tìm theo Tên
    const byName = await this.repository.findByName(trimmed);
    if (byName) return byName;

    // 4. Thử tìm tương đối trong 4 danh mục chuẩn
    await this.ensureStandardCategories();
    const lower = trimmed.toLowerCase();
    for (const std of STANDARD_BAKERY_CATEGORIES) {
      if (
        std.name.toLowerCase().includes(lower) ||
        lower.includes(std.slug) ||
        ((lower.includes('trưng bày') || lower.includes('tủ') || lower.includes('mát') || lower.includes('bảo quản') || lower.includes('bánh kem') || lower.includes('tu-trung-bay') || lower.includes('cat-tu')) && std.slug === 'tu-trung-bay-banh') ||
        ((lower.includes('lò') || lower.includes('nướng') || lower.includes('đối lưu') || lower.includes('lo-nuong') || lower.includes('cat-lo')) && std.slug === 'lo-nuong-cong-nghiep') ||
        ((lower.includes('trộn') || lower.includes('đánh trứng') || lower.includes('nhào') || lower.includes('cối') || lower.includes('may-tron') || lower.includes('cat-may')) && std.slug === 'may-tron-bot-danh-trung') ||
        ((lower.includes('tạo hình') || lower.includes('phụ trợ') || lower.includes('chia') || lower.includes('cán') || lower.includes('khay') || lower.includes('phu-tro')) && std.slug === 'thiet-bi-phu-tro')
      ) {
        const found = await this.repository.findBySlug(std.slug);
        if (found) return found;
      }
    }

    return null;
  }

  async getAllCategories(isActive?: boolean) {
    // Đảm bảo 4 danh mục chuẩn luôn sẵn sàng
    try {
      await this.ensureStandardCategories();
      const items = await this.repository.findAll(
        isActive !== undefined ? { isActive } : undefined,
      );
      // Lọc sạch triệt để các danh mục giả lập/nhầm lẫn từ trước (sách, giáo trình, máy tính cũ, sinh viên)
      const valid = items.filter((c) => {
        const lowerName = (c.name || '').toLowerCase();
        const lowerSlug = (c.slug || '').toLowerCase();
        return (
          !lowerName.includes('sách') &&
          !lowerName.includes('giáo trình') &&
          !lowerName.includes('sinh viên') &&
          !lowerName.includes('laptop') &&
          !lowerName.includes('máy tính') &&
          !lowerSlug.includes('sach') &&
          !lowerSlug.includes('giao-trinh') &&
          !lowerSlug.includes('sinh-vien')
        );
      });
      if (valid.length > 0) return valid;
    } catch {
      // Ignored
    }

    return STANDARD_BAKERY_CATEGORIES.map((c, idx) => ({
      id: `cat-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: null,
      parentId: null,
      sortOrder: c.sortOrder ?? idx + 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any;
  }

  async getCategoryTree() {
    return this.repository.findTree();
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với slug: "${slug}"`);
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const rawName = (dto.name || '').trim();
    if (!rawName) {
      throw new ConflictException('Tên danh mục không được để trống!');
    }

    let slug = dto.slug ? dto.slug.trim().toLowerCase() : '';
    if (!slug) {
      slug = slugifyVietnamese(rawName);
    }

    const existingName = await this.repository.findByName(rawName);
    if (existingName) {
      throw new ConflictException(`Tên danh mục "${rawName}" đã tồn tại!`);
    }

    const existingSlug = await this.repository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictException(`Slug danh mục "${slug}" đã tồn tại!`);
    }

    return this.repository.create({
      name: rawName,
      slug: slug,
      description: dto.description?.trim(),
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy danh mục có ID: "${id}"`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugCheck = await this.repository.findBySlug(dto.slug);
      if (slugCheck) {
        throw new ConflictException(`Slug danh mục "${dto.slug}" đã tồn tại`);
      }
    }

    return this.repository.update(id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      parent: dto.parentId
        ? { connect: { id: dto.parentId } }
        : dto.parentId === null
        ? { disconnect: true }
        : undefined,
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy danh mục có ID: "${id}"`);
    }
    return this.repository.delete(id);
  }
}
