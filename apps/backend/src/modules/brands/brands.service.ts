import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly repository: BrandsRepository) {}

  async getAllBrands(isActive?: boolean) {
    return this.repository.findAll(
      isActive !== undefined ? { isActive } : undefined,
    );
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.repository.findBySlug(slug);
    if (!brand) {
      throw new NotFoundException(`Không tìm thấy thương hiệu với slug: "${slug}"`);
    }
    return brand;
  }

  async createBrand(dto: CreateBrandDto) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Slug thương hiệu "${dto.slug}" đã tồn tại`);
    }

    return this.repository.create({
      name: dto.name,
      slug: dto.slug,
      logoUrl: dto.logoUrl,
      originCountry: dto.originCountry,
      description: dto.description,
      website: dto.website,
      isActive: dto.isActive ?? true,
    });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy thương hiệu có ID: "${id}"`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugCheck = await this.repository.findBySlug(dto.slug);
      if (slugCheck) {
        throw new ConflictException(`Slug thương hiệu "${dto.slug}" đã tồn tại`);
      }
    }

    return this.repository.update(id, {
      name: dto.name,
      slug: dto.slug,
      logoUrl: dto.logoUrl,
      originCountry: dto.originCountry,
      description: dto.description,
      website: dto.website,
      isActive: dto.isActive,
    });
  }

  async deleteBrand(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy thương hiệu có ID: "${id}"`);
    }
    return this.repository.delete(id);
  }
}
