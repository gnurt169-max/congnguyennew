import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseSyncService {
  private readonly logger = new Logger(DatabaseSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phương thức chỉ được gọi khi lập trình viên yêu cầu đồng bộ thủ công.
   * TUYỆT ĐỐI KHÔNG tự động chạy trên hook khởi động của NestJS để bảo toàn 100% dữ liệu đã sửa.
   */
  async syncDatabaseMedia() {
    const productCount = await this.prisma.product.count();
    if (productCount > 0) {
      this.logger.log(`🛡️ [DatabaseSyncService] Database đã có ${productCount} sản phẩm thực tế. Bỏ qua auto-seed để bảo toàn 100% dữ liệu hiện có.`);
      return;
    }

    this.logger.log('🔄 [Auto-Seed] Đang quét và khởi tạo dữ liệu ban đầu cho database trống...');
    try {
      await this.ensureProductionData();
      await this.syncProductImages();
      await this.syncPaymentQrConfig();
      await this.syncHomepageMedia();
      this.logger.log('✅ [Auto-Seed] Khởi tạo dữ liệu hình ảnh sản phẩm & mã QR hoàn tất!');
    } catch (error: any) {
      this.logger.error(`❌ [Auto-Seed] Lỗi khi đồng bộ hình ảnh: ${error.message}`, error.stack);
    }
  }

  private async ensureProductionData() {
    const productCount = await this.prisma.product.count();
    if (productCount > 0) {
      this.logger.log(`[Auto-Seed] Database hiện có ${productCount} sản phẩm, bỏ qua nạp lại.`);
      return;
    }

    this.logger.warn(`[Auto-Seed] Database chỉ có ${productCount} sản phẩm (< 8). Đang tự động nạp từ production-seed-data.json...`);

    const seedPaths = [
      path.resolve(process.cwd(), 'prisma', 'production-seed-data.json'),
      path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'production-seed-data.json'),
      path.resolve(process.cwd(), 'packages', 'database', 'data-sync.json'),
      path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
      path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
    ];

    let seedFile: string | null = null;
    for (const p of seedPaths) {
      if (fs.existsSync(p)) {
        seedFile = p;
        break;
      }
    }

    if (!seedFile) {
      this.logger.warn('[Auto-Seed] Không tìm thấy file dữ liệu seed!');
      return;
    }

    try {
      const raw = fs.readFileSync(seedFile, 'utf-8');
      const payload = JSON.parse(raw);
      const data = payload.data || payload;

      // 1. Danh mục
      if (Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          await this.prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
              name: cat.name,
              description: cat.description,
              imageUrl: cat.imageUrl,
              sortOrder: cat.sortOrder ?? 0,
              isActive: cat.isActive ?? true,
            },
            create: {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              imageUrl: cat.imageUrl,
              sortOrder: cat.sortOrder ?? 0,
              isActive: cat.isActive ?? true,
            },
          });
        }
      }

      // 2. Thương hiệu
      if (Array.isArray(data.brands)) {
        for (const br of data.brands) {
          await this.prisma.brand.upsert({
            where: { slug: br.slug },
            update: {
              name: br.name,
              originCountry: br.originCountry,
              logoUrl: br.logoUrl,
              description: br.description,
              website: br.website,
              isActive: br.isActive ?? true,
            },
            create: {
              id: br.id,
              name: br.name,
              slug: br.slug,
              originCountry: br.originCountry,
              logoUrl: br.logoUrl,
              description: br.description,
              website: br.website,
              isActive: br.isActive ?? true,
            },
          });
        }
      }

      // 3. Sản phẩm
      if (Array.isArray(data.products)) {
        for (const p of data.products) {
          const img = p.imageUrl || p.thumbnail;
          const prodRecord = await this.prisma.product.upsert({
            where: { slug: p.slug },
            update: {
              name: p.name,
              modelCode: p.modelCode,
              summary: p.summary,
              description: p.description,
              brandId: p.brandId,
              categoryId: p.categoryId,
              isQuoteOnly: Boolean(p.isQuoteOnly),
              condition: p.condition || 'REFURBISHED_FULL',
              availability: p.availability || 'AVAILABLE',
              stock: p.stock !== undefined ? Number(p.stock) : 1,
              soldCount: p.soldCount !== undefined ? Number(p.soldCount) : 0,
              status: p.status || 'available',
              originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
              basePrice: p.basePrice ? Number(p.basePrice) : null,
              minPrice: p.minPrice ? Number(p.minPrice) : null,
              maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
              refurbishDetails: p.refurbishDetails,
              testVideoUrl: p.testVideoUrl,
              imageUrl: img,
              thumbnail: img,
              images: p.images || (img ? [img] : []),
              warrantyMonths: p.warrantyMonths ? Number(p.warrantyMonths) : 12,
              isFeatured: Boolean(p.isFeatured),
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            },
            create: {
              id: p.id,
              name: p.name,
              slug: p.slug,
              modelCode: p.modelCode,
              summary: p.summary,
              description: p.description,
              brandId: p.brandId,
              categoryId: p.categoryId,
              isQuoteOnly: Boolean(p.isQuoteOnly),
              condition: p.condition || 'REFURBISHED_FULL',
              availability: p.availability || 'AVAILABLE',
              stock: p.stock !== undefined ? Number(p.stock) : 1,
              soldCount: p.soldCount !== undefined ? Number(p.soldCount) : 0,
              status: p.status || 'available',
              originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
              basePrice: p.basePrice ? Number(p.basePrice) : null,
              minPrice: p.minPrice ? Number(p.minPrice) : null,
              maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
              refurbishDetails: p.refurbishDetails,
              testVideoUrl: p.testVideoUrl,
              imageUrl: img,
              thumbnail: img,
              images: p.images || (img ? [img] : []),
              warrantyMonths: p.warrantyMonths ? Number(p.warrantyMonths) : 12,
              isFeatured: Boolean(p.isFeatured),
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            },
          });

          if (Array.isArray(p.variants)) {
            for (const v of p.variants) {
              await this.prisma.productVariant.upsert({
                where: { sku: v.sku },
                update: {
                  name: v.name,
                  price: v.price ? Number(v.price) : null,
                  originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
                  stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : 1,
                  powerType: v.powerType || 'SINGLE_PHASE_220V',
                  isQuoteOnly: Boolean(v.isQuoteOnly),
                  isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
                },
                create: {
                  id: v.id,
                  productId: prodRecord.id,
                  sku: v.sku,
                  name: v.name,
                  price: v.price ? Number(v.price) : null,
                  originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
                  stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : 1,
                  powerType: v.powerType || 'SINGLE_PHASE_220V',
                  isQuoteOnly: Boolean(v.isQuoteOnly),
                  isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
                },
              });
            }
          }
        }
      }

      // 4. Cấu hình thương hiệu & SEO
      const settingsList = data.generalSettings || data.siteSettings || [];
      if (Array.isArray(settingsList) && settingsList.length > 0) {
        const s = settingsList[0];
        const updatePayload = {
          brandName: s.brandName || 'CÔNG NGUYÊN',
          brandTagline: s.brandTagline || 'Giải Pháp Máy Làm Bánh Công Nghiệp',
          brandLogoText: s.brandLogoText || 'CN',
          seoTitle: s.seoTitle || 'Công Nguyên - Máy Làm Bánh Công Nghiệp & Thanh Lý TP.HCM',
          seoDescription:
            s.seoDescription ||
            'Xưởng máy làm bánh Công Nguyên chuyên mua bán, tân trang và thanh lý lò nướng, máy trộn bột công nghiệp. Kiểm định kỹ thuật tận tâm, bảo hành uy tín tại TP.HCM.',
          adminMenuLabels: s.adminMenuLabels || undefined,
        };

        await this.prisma.generalSettings.upsert({
          where: { id: s.id || 'default' },
          update: updatePayload,
          create: { id: s.id || 'default', ...updatePayload },
        });

        try {
          await this.prisma.siteSetting.upsert({
            where: { id: s.id || 'default' },
            update: updatePayload,
            create: { id: s.id || 'default', ...updatePayload },
          });
        } catch {}
      }

      this.logger.log('[Auto-Seed] Tự động nạp dữ liệu production-seed-data.json thành công!');
    } catch (e: any) {
      this.logger.error(`[Auto-Seed] Lỗi khi nạp dữ liệu ban đầu: ${e.message}`);
    }
  }

  private findProductsDir(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'apps', 'frontend', 'public', 'uploads', 'products'),
      path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads', 'products'),
      path.resolve(process.cwd(), 'public', 'uploads', 'products'),
      path.resolve(__dirname, '../../../../apps/frontend/public/uploads/products'),
      path.resolve(__dirname, '../../../frontend/public/uploads/products'),
      path.resolve(__dirname, '../../public/uploads/products'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }
    return null;
  }

  private findPaymentDir(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'apps', 'frontend', 'public', 'uploads', 'payment'),
      path.resolve(process.cwd(), '..', 'frontend', 'public', 'uploads', 'payment'),
      path.resolve(process.cwd(), 'public', 'uploads', 'payment'),
      path.resolve(__dirname, '../../../../apps/frontend/public/uploads/payment'),
      path.resolve(__dirname, '../../../frontend/public/uploads/payment'),
      path.resolve(__dirname, '../../public/uploads/payment'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }
    return null;
  }

  private async syncProductImages() {
    const productsDir = this.findProductsDir();
    if (!productsDir) {
      this.logger.warn('[Auto-Seed] Không tìm thấy thư mục ảnh uploads/products!');
      return;
    }

    const files = fs.readdirSync(productsDir);
    this.logger.log(`[Auto-Seed] Thư mục ảnh sản phẩm: ${productsDir} (${files.length} tệp tin)`);

    // Danh sách 8 thiết bị bánh thực tế và thứ tự ưu tiên tên file ảnh
    const machineMappings = [
      {
        slugKey: 'southstar',
        nameKey: 'southstar',
        preferredFiles: ['lo-nuong-southstar.webp', 'oi-a-oi-i-i-lui-u-southstas-1793447455790-js4th.webp'],
      },
      {
        slugKey: 'doi-luu-4-mam-trung-quoc',
        nameKey: '4 mâm trung quốc',
        preferredFiles: ['lo-nuong-doi-luu-4-mam-trung-quoc.webp', 'loi-a-oi-i-i-lui-u-4-mai-m-trung-quoi-i--1793447804125-0w1tk.webp'],
      },
      {
        slugKey: 'hewwu',
        nameKey: 'hewwu',
        preferredFiles: ['lo-nuong-hewwu.webp', 'loi-hewwu-tq-1793447904676-zk5qf.webp'],
      },
      {
        slugKey: 'hobat',
        nameKey: 'hobat',
        preferredFiles: ['coi-danh-trung-hobat.webp', 'coi-i-i-a-ai-i-loan-hobat-1793447890074-wk4q0.webp'],
      },
      {
        slugKey: 'tu-bao-quan-2-canh-mo-ruyshing',
        nameKey: '2 cánh mở',
        preferredFiles: ['tu-bao-quan-2-canh-mo-ruyshing.webp', 'tui-2-cai-nh-ruyshing-1793447834194-aktah.webp'],
      },
      {
        slugKey: 'tu-mat-bao-quan-2-canh-lua-ruyshing',
        nameKey: '2 cánh lùa',
        preferredFiles: ['tu-mat-2-canh-lua-ruyshing.webp', 'tui-2-cai-nh-lui-a-ruyshing-1793447825108-kq6m5.webp'],
      },
      {
        slugKey: '1m8',
        nameKey: '1m8',
        preferredFiles: ['tu-banh-kem-1m8-ruyshing.webp', '1m8-5-tai-i-ng-a-ai-i-loan-ruyshing-1793447586623-9ztjr.webp'],
      },
      {
        slugKey: '1m5',
        nameKey: '1m5',
        preferredFiles: ['tu-banh-kem-1m5-ruyshing.webp', '1m5-5-tai-i-ng-a-ai-i-loan-ruyshing-1793447575656-p75mn.webp'],
      },
    ];

    const allProducts = await this.prisma.product.findMany();
    for (const prod of allProducts) {
      let matchedFile: string | null = null;
      const lowerName = prod.name.toLowerCase();
      const lowerSlug = prod.slug.toLowerCase();

      for (const m of machineMappings) {
        if (lowerSlug.includes(m.slugKey) || lowerName.includes(m.nameKey)) {
          for (const cand of m.preferredFiles) {
            if (files.includes(cand)) {
              matchedFile = cand;
              break;
            }
          }
          if (matchedFile) break;
        }
      }

      // Khớp theo slug trực tiếp nếu có file trùng tên slug
      if (!matchedFile) {
        const directSlugMatch = files.find((f) => f.startsWith(prod.slug));
        if (directSlugMatch) {
          matchedFile = directSlugMatch;
        }
      }

      if (matchedFile) {
        const targetUrl = `/uploads/products/${matchedFile}`;
        const hasExistingValidImage = prod.imageUrl && prod.imageUrl.trim() !== '' && !prod.imageUrl.includes('placeholder');
        if (!hasExistingValidImage) {
          await this.prisma.product.update({
            where: { id: prod.id },
            data: {
              imageUrl: targetUrl,
              thumbnail: targetUrl,
              images: [targetUrl],
            },
          });
          this.logger.log(`  ✓ Đã cập nhật ảnh sản phẩm "${prod.name}": imageUrl = ${targetUrl}`);
        }
      }
    }
  }

  private async syncPaymentQrConfig() {
    const paymentDir = this.findPaymentDir();
    let hasMomoWebp = true;
    if (paymentDir) {
      hasMomoWebp = fs.existsSync(path.join(paymentDir, 'momo-qr.webp'));
    }

    const momoQrUrl = hasMomoWebp ? '/uploads/payment/momo-qr.webp' : '/uploads/payment/momo-qr.png';

    const existingConfig = await this.prisma.paymentConfig.findUnique({
      where: { id: 'default' },
    });

    if (!existingConfig) {
      await this.prisma.paymentConfig.create({
        data: {
          id: 'default',
          bankId: 'TPB',
          bankName: 'TPBank (Ngân hàng Tiên Phong)',
          accountNumber: '1029384756',
          accountHolder: 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
          isBankEnabled: true,
          momoPhone: '0976619044',
          momoName: 'CONG NGUYEN MACHINERY',
          momoQrUrl: momoQrUrl,
          isMomoEnabled: true,
        },
      });
      this.logger.log(`  ✓ Khởi tạo PaymentConfig với momoQrUrl = ${momoQrUrl}`);
    } else if (existingConfig.momoQrUrl !== momoQrUrl) {
      await this.prisma.paymentConfig.update({
        where: { id: 'default' },
        data: {
          momoQrUrl: momoQrUrl,
        },
      });
      this.logger.log(`  ✓ Cập nhật PaymentConfig: momoQrUrl = ${momoQrUrl}`);
    }
  }

  private async syncHomepageMedia() {
    const homeConfig = await this.prisma.homepageConfig.findUnique({
      where: { id: 'default' },
    });

    if (homeConfig) {
      let changed = false;
      let newFeatured = homeConfig.featuredImageUrl;
      let newAvatar = homeConfig.founderAvatarUrl;

      if (!newFeatured || newFeatured === '' || newFeatured.includes('placeholder') || newFeatured.includes('unsplash')) {
        newFeatured = '/uploads/products/lo-nuong-southstar.webp';
        changed = true;
      }

      if (!newAvatar || newAvatar === '' || newAvatar.includes('placeholder')) {
        newAvatar = '/uploads/products/congnguyen-1793445417987-nqrgf.webp';
        changed = true;
      }

      if (changed) {
        await this.prisma.homepageConfig.update({
          where: { id: 'default' },
          data: {
            featuredImageUrl: newFeatured,
            founderAvatarUrl: newAvatar,
          },
        });
        this.logger.log(`  ✓ Đồng bộ HomepageConfig featuredImageUrl & founderAvatarUrl`);
      }
    }
  }
}

