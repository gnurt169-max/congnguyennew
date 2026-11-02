import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PowerType } from '@prisma/client';
import { ProductSortOption } from './dto/query-products.dto';

export interface ProductFilterOptions {
  category?: string;
  categorySlug?: string;
  categoryId?: string;
  condition?: string;
  brand?: string;
  brandSlug?: string;
  brandId?: string;
  powerSource?: string;
  powerType?: string;
  power?: string;
  isQuoteOnly?: boolean;
  search?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  sortBy?: string;
  stockStatus?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyWithPaginationAndFilter(options: ProductFilterOptions) {
    const page = Math.max(1, Number(options.page ?? 1));
    const limit = Math.min(Math.max(Number(options.limit ?? 12), 1), 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Lọc theo cờ Nút Đôi (RFQ vs Mua ngay)
    if (options.isQuoteOnly !== undefined) {
      where.isQuoteOnly = options.isQuoteOnly;
    }

    // Lọc theo tình trạng tồn kho: stockStatus = 'all' | 'in_stock' | 'sold_out' hoặc inStock = true | false
    if (options.stockStatus === 'in_stock' || options.inStock === true) {
      where.stock = { gt: 0 };
    } else if (options.stockStatus === 'sold_out' || options.inStock === false) {
      where.stock = { lte: 0 };
    }

    // 1. Lọc theo Danh mục (Hỗ trợ category, categorySlug, categoryId và alias tiếng Việt không dấu)
    const targetCat = options.category || options.categorySlug || options.categoryId;
    if (targetCat) {
      let catSlug = targetCat;
      if (catSlug === 'may-tron-bot') catSlug = 'may-tron-bot-danh-trung';
      else if (catSlug === 'tu-trung-bay') catSlug = 'tu-trung-bay-banh';
      else if (catSlug === 'lo-nuong') catSlug = 'lo-nuong-cong-nghiep';

      where.category = {
        OR: [
          { slug: catSlug },
          { slug: targetCat },
          { id: targetCat },
          { parent: { slug: catSlug } },
        ],
      };
    }

    // 2. Lọc theo Độ mới / Tình trạng máy (Enum ProductCondition)
    if (options.condition) {
      where.condition = options.condition as any;
    }

    // 3. Lọc theo Thương hiệu
    const targetBrand = options.brandSlug || options.brand || options.brandId;
    if (targetBrand) {
      where.brand = {
        OR: [
          { slug: targetBrand },
          { id: targetBrand },
          { name: { contains: targetBrand, mode: 'insensitive' } },
        ],
      };
    }

    // 4. Lọc theo Nguồn điện (powerSource / powerType / power)
    const targetPower = options.powerSource || options.powerType || options.power;
    if (targetPower) {
      let mappedType: PowerType | undefined = undefined;
      const lowerPower = targetPower.toLowerCase();
      if (lowerPower.includes('380') || targetPower === 'THREE_PHASE_380V') {
        mappedType = PowerType.THREE_PHASE_380V;
      } else if (lowerPower.includes('220') || targetPower === 'SINGLE_PHASE_220V') {
        mappedType = PowerType.SINGLE_PHASE_220V;
      }

      where.variants = {
        some: {
          OR: [
            ...(mappedType ? [{ powerType: mappedType }] : []),
            { name: { contains: targetPower, mode: 'insensitive' } },
            { sku: { contains: targetPower, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      };
    }

    // 5. Lọc theo Khoảng giá
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      where.basePrice = {
        gte: options.minPrice !== undefined ? options.minPrice : undefined,
        lte: options.maxPrice !== undefined ? options.maxPrice : undefined,
      };
    }

    // 6. Tìm kiếm Full text / từ khóa trên tên máy, model, mô tả, thương hiệu
    const searchTerms = (options.search || options.q || '').trim();
    if (searchTerms) {
      where.OR = [
        { name: { contains: searchTerms, mode: 'insensitive' } },
        { modelCode: { contains: searchTerms, mode: 'insensitive' } },
        { summary: { contains: searchTerms, mode: 'insensitive' } },
        { description: { contains: searchTerms, mode: 'insensitive' } },
        { brand: { name: { contains: searchTerms, mode: 'insensitive' } } },
        {
          variants: {
            some: {
              sku: { contains: searchTerms, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // 7. Sắp xếp: Ưu tiên máy còn hàng (stock > 0) lên trước
    const sortVal = options.sort || options.sortBy || 'createdAt_desc';
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = [
      { stock: 'desc' },
      { createdAt: 'desc' },
    ];
    switch (sortVal) {
      case 'createdAt_asc':
        orderBy = [{ stock: 'desc' }, { createdAt: 'asc' }];
        break;
      case 'price_asc':
        orderBy = [{ stock: 'desc' }, { basePrice: 'asc' }];
        break;
      case 'price_desc':
        orderBy = [{ stock: 'desc' }, { basePrice: 'desc' }];
        break;
      case 'name_asc':
        orderBy = [{ stock: 'desc' }, { name: 'asc' }];
        break;
      case 'stock_desc':
        orderBy = { stock: 'desc' };
        break;
      case 'stock_asc':
        orderBy = { stock: 'asc' };
        break;
      default:
        orderBy = [{ stock: 'desc' }, { createdAt: 'desc' }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          modelCode: true,
          summary: true,
          condition: true,
          availability: true,
          stock: true,
          soldCount: true,
          status: true,
          originalPrice: true,
          basePrice: true,
          minPrice: true,
          maxPrice: true,
          currency: true,
          thumbnail: true,
          warrantyMonths: true,
          isFeatured: true,
          isQuoteOnly: true,
          isActive: true,
          refurbishDetails: true,
          createdAt: true,
          updatedAt: true,
          brandId: true,
          categoryId: true,
          brand: {
            select: { id: true, name: true, slug: true, originCountry: true, logoUrl: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              originalPrice: true,
              powerType: true,
              powerKw: true,
              weightKg: true,
              stockQuantity: true,
              isQuoteOnly: true,
            },
            orderBy: { price: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findRecentProducts(limit: number = 8) {
    const take = Math.min(Math.max(Number(limit), 1), 50);
    return this.prisma.product.findMany({
      where: {
        availability: 'AVAILABLE',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        modelCode: true,
        summary: true,
        condition: true,
        availability: true,
        stock: true,
        status: true,
        originalPrice: true,
        basePrice: true,
        minPrice: true,
        maxPrice: true,
        currency: true,
        thumbnail: true,
        isQuoteOnly: true,
        refurbishDetails: true,
        createdAt: true,
        brand: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            originalPrice: true,
            stockQuantity: true,
            powerType: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async findBySlugWithDetails(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: {
          include: { parent: true },
        },
        variants: {
          where: { isActive: true },
          include: {
            attributeValues: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        brand: true,
        category: true,
      },
    });
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: {
        brand: true,
        category: true,
        variants: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        brand: true,
        category: true,
        variants: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // --- QUẢN LÝ BIẾN THỂ (VARIANTS) ---

  async findVariantBySku(sku: string) {
    return this.prisma.productVariant.findUnique({
      where: { sku },
    });
  }

  async createVariant(
    productId: string,
    data: Prisma.ProductVariantCreateWithoutProductInput,
    attributeValueIds?: string[],
  ) {
    return this.prisma.productVariant.create({
      data: {
        ...data,
        product: { connect: { id: productId } },
        attributeValues: attributeValueIds?.length
          ? {
              create: attributeValueIds.map((attrValId) => ({
                attributeValue: { connect: { id: attrValId } },
              })),
            }
          : undefined,
      },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    });
  }

  async updateVariant(
    id: string,
    data: Prisma.ProductVariantUpdateInput,
    attributeValueIds?: string[],
  ) {
    if (attributeValueIds) {
      await this.prisma.variantAttributeValue.deleteMany({
        where: { variantId: id },
      });
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...data,
        attributeValues: attributeValueIds?.length
          ? {
              create: attributeValueIds.map((attrValId) => ({
                attributeValue: { connect: { id: attrValId } },
              })),
            }
          : undefined,
      },
      include: {
        attributeValues: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    });
  }

  async deleteVariant(id: string) {
    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  /**
   * Trừ tồn kho nguyên tử (Atomic Stock Deduction) chống Race-condition:
   * UPDATE products SET stock = stock - quantity, sold_count = sold_count + quantity WHERE id = :id AND stock >= quantity
   * Sau khi trừ: Nếu stock <= 0, tự động gán nhãn status = 'out_of_stock' và availability = 'SOLD'
   */
  async deductStockAtomic(productId: string, quantity = 1) {
    const updateResult = await this.prisma.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
        soldCount: { increment: quantity },
      },
    });

    if (updateResult.count > 0) {
      const current = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true },
      });
      if (current && current.stock <= 0) {
        await this.prisma.product.update({
          where: { id: productId },
          data: {
            status: 'out_of_stock',
            availability: 'SOLD',
          },
        });
      }
      return { success: true, remainingStock: current?.stock ?? 0 };
    }
    return { success: false, remainingStock: 0 };
  }
}
