import {
  PrismaClient,
  PowerType,
  ProductCondition,
  ProductAvailability,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function getSafeDirname(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  return process.cwd();
}

async function main() {
  const currentDir = getSafeDirname();
  console.log('🌱 Bắt đầu quy trình nạp dữ liệu Seed cho Công Nguyên...');

  // ==========================================
  // 0. TÀI KHOẢN ADMIN MẶC ĐỊNH (admin / admin)
  // ==========================================
  const defaultAdminHash = '$2b$10$w8T0FhF.Zt70hXqBGBm9qevjYV5E5fK8zUfFjQZ9P1sK6l0Z7oRiy';

  await prisma.staffUser.upsert({
    where: { email: 'admin@congnguyen.com.vn' },
    update: {
      passwordHash: defaultAdminHash,
      fullName: 'Quản trị viên Công Nguyên',
      phoneNumber: '0976619044',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@congnguyen.com.vn',
      passwordHash: defaultAdminHash,
      fullName: 'Quản trị viên Công Nguyên',
      phoneNumber: '0976619044',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('  ✓ Tài khoản Admin: admin@congnguyen.com.vn');

  // ==========================================
  // SAFE GUARD & UPSERT: BẢO TOÀN DỮ LIỆU THỰC TẾ
  // ==========================================
  const productCount = await prisma.product.count();
  console.log(`ℹ️ Hiện có ${productCount} sản phẩm trong Database. Bắt đầu quá trình đồng bộ (upsert bảo toàn dữ liệu)...`);

  // ==========================================
  // 1. TÌM FILE DỮ LIỆU SAO LƯU (INITIAL-DATA.JSON HOẶC DATA-SYNC.JSON)
  // ==========================================
  const backupPaths = [
    path.join(currentDir, 'initial-data.json'),
    path.resolve(process.cwd(), 'prisma', 'initial-data.json'),
    path.resolve(process.cwd(), 'packages', 'database', 'data-sync.json'),
    path.join(currentDir, 'production-seed-data.json'),
    path.resolve(process.cwd(), 'prisma', 'production-seed-data.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'initial-data.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'production-seed-data.json'),
    path.join(currentDir, 'data-backup.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
  ];

  let backupFile: string | null = null;
  for (const p of backupPaths) {
    if (fs.existsSync(p)) {
      backupFile = p;
      break;
    }
  }

  if (backupFile) {
    console.log(`📂 Tìm thấy file sao lưu dữ liệu tại: ${backupFile}`);
    try {
      const rawContent = fs.readFileSync(backupFile, 'utf-8');
      const backup = JSON.parse(rawContent);
      const data = backup.data || backup;

      // 1.1 Đồng bộ Danh mục (Categories)
      if (Array.isArray(data.categories)) {
        console.log(`  🔄 Nạp ${data.categories.length} danh mục...`);
        for (const cat of data.categories) {
          await prisma.category.upsert({
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

      // 1.2 Đồng bộ Thương hiệu (Brands)
      if (Array.isArray(data.brands)) {
        console.log(`  🔄 Nạp ${data.brands.length} thương hiệu...`);
        for (const br of data.brands) {
          await prisma.brand.upsert({
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

      // 1.3 Đồng bộ Sản phẩm và Biến thể (Products & Variants)
      if (Array.isArray(data.products)) {
        console.log(`  🔄 Nạp và đồng bộ ${data.products.length} sản phẩm thực tế...`);
        for (const p of data.products) {
          const variants = p.variants || [];

          // Map enum an toàn
          const cond = p.condition && Object.values(ProductCondition).includes(p.condition as any)
            ? p.condition
            : ProductCondition.REFURBISHED_FULL;

          const avail = p.availability && Object.values(ProductAvailability).includes(p.availability as any)
            ? p.availability
            : ProductAvailability.AVAILABLE;

          const prodRecord = await prisma.product.upsert({
            where: { slug: p.slug },
            update: {
              name: p.name,
              modelCode: p.modelCode,
              summary: p.summary,
              description: p.description,
              brandId: p.brandId,
              categoryId: p.categoryId,
              isQuoteOnly: Boolean(p.isQuoteOnly),
              condition: cond as any,
              availability: avail as any,
              stock: p.stock !== undefined ? Number(p.stock) : 1,
              soldCount: p.soldCount !== undefined ? Number(p.soldCount) : 0,
              status: p.status || 'available',
              originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
              basePrice: p.basePrice ? Number(p.basePrice) : null,
              minPrice: p.minPrice ? Number(p.minPrice) : null,
              maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
              refurbishDetails: p.refurbishDetails,
              testVideoUrl: p.testVideoUrl,
              imageUrl: p.imageUrl || p.thumbnail,
              thumbnail: p.imageUrl || p.thumbnail,
              images: p.images,
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
              condition: cond as any,
              availability: avail as any,
              stock: p.stock !== undefined ? Number(p.stock) : 1,
              soldCount: p.soldCount !== undefined ? Number(p.soldCount) : 0,
              status: p.status || 'available',
              originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
              basePrice: p.basePrice ? Number(p.basePrice) : null,
              minPrice: p.minPrice ? Number(p.minPrice) : null,
              maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
              refurbishDetails: p.refurbishDetails,
              testVideoUrl: p.testVideoUrl,
              imageUrl: p.imageUrl || p.thumbnail,
              thumbnail: p.imageUrl || p.thumbnail,
              images: p.images,
              warrantyMonths: p.warrantyMonths ? Number(p.warrantyMonths) : 12,
              isFeatured: Boolean(p.isFeatured),
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            },
          });

          // Nạp các biến thể của sản phẩm
          for (const v of variants) {
            const pType = v.powerType && Object.values(PowerType).includes(v.powerType as any)
              ? v.powerType
              : PowerType.SINGLE_PHASE_220V;

            await prisma.productVariant.upsert({
              where: { sku: v.sku },
              update: {
                name: v.name,
                price: v.price ? Number(v.price) : null,
                originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
                stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : 1,
                powerType: pType as any,
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
                powerType: pType as any,
                isQuoteOnly: Boolean(v.isQuoteOnly),
                isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
              },
            });
          }
        }
      }

      // 1.4 Đồng bộ Cấu hình trang chủ (HomepageConfig)
      if (Array.isArray(data.homepageConfigs) && data.homepageConfigs.length > 0) {
        const h = data.homepageConfigs[0];
        console.log('  🔄 Nạp cấu hình HomepageConfig...');
        await prisma.homepageConfig.upsert({
          where: { id: h.id || 'default' },
          update: {
            badgeText: h.badgeText,
            headingText: h.headingText,
            headingHighlight: h.headingHighlight,
            description: h.description,
            primaryCtaText: h.primaryCtaText,
            primaryCtaLink: h.primaryCtaLink,
            secondaryCtaText: h.secondaryCtaText,
            secondaryCtaLink: h.secondaryCtaLink,
            stats: h.stats,
            featuredImageUrl: h.featuredImageUrl || '',
            featuredBadgeTag: h.featuredBadgeTag,
            featuredCategoryTag: h.featuredCategoryTag,
            featuredTitle: h.featuredTitle,
            featuredStatusTag: h.featuredStatusTag,
            founderShow: h.founderShow !== undefined ? Boolean(h.founderShow) : true,
            founderName: h.founderName || 'Vương Công Nguyên',
            founderTitle: h.founderTitle || 'Chủ Xưởng Kỹ Thuật',
            founderCommitment: h.founderCommitment || 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng',
            founderAvatarUrl: h.founderAvatarUrl,
            founderLine: h.founderLine,
          },
          create: {
            id: h.id || 'default',
            badgeText: h.badgeText,
            headingText: h.headingText,
            headingHighlight: h.headingHighlight,
            description: h.description,
            primaryCtaText: h.primaryCtaText,
            primaryCtaLink: h.primaryCtaLink,
            secondaryCtaText: h.secondaryCtaText,
            secondaryCtaLink: h.secondaryCtaLink,
            stats: h.stats,
            featuredImageUrl: h.featuredImageUrl || '',
            featuredBadgeTag: h.featuredBadgeTag,
            featuredCategoryTag: h.featuredCategoryTag,
            featuredTitle: h.featuredTitle,
            featuredStatusTag: h.featuredStatusTag,
            founderShow: h.founderShow !== undefined ? Boolean(h.founderShow) : true,
            founderName: h.founderName || 'Vương Công Nguyên',
            founderTitle: h.founderTitle || 'Chủ Xưởng Kỹ Thuật',
            founderCommitment: h.founderCommitment || 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng',
            founderAvatarUrl: h.founderAvatarUrl,
            founderLine: h.founderLine,
          },
        });
      }

      // 1.5 Đồng bộ Cấu hình hiển thị (SectionVisibility)
      if (Array.isArray(data.sectionVisibilities) && data.sectionVisibilities.length > 0) {
        const v = data.sectionVisibilities[0];
        console.log('  🔄 Nạp cấu hình SectionVisibility...');
        await prisma.sectionVisibility.upsert({
          where: { id: v.id || 'default' },
          update: {
            showBadge: v.showBadge ?? true,
            showHeroStats: v.showHeroStats ?? true,
            showHeroFeaturedCard: v.showHeroFeaturedCard ?? true,
            showSecondaryCTA: v.showSecondaryCTA ?? true,
            showFloatingContact: v.showFloatingContact ?? true,
            showWorkshopLocation: v.showWorkshopLocation ?? false,
            showHotProductsSection: v.showHotProductsSection ?? true,
            showTestimonials: v.showTestimonials ?? true,
          },
          create: {
            id: v.id || 'default',
            showBadge: v.showBadge ?? true,
            showHeroStats: v.showHeroStats ?? true,
            showHeroFeaturedCard: v.showHeroFeaturedCard ?? true,
            showSecondaryCTA: v.showSecondaryCTA ?? true,
            showFloatingContact: v.showFloatingContact ?? true,
            showWorkshopLocation: v.showWorkshopLocation ?? false,
            showHotProductsSection: v.showHotProductsSection ?? true,
            showTestimonials: v.showTestimonials ?? true,
          },
        });
      }

      // 1.6 Đồng bộ Cấu hình Thương hiệu & SEO (GeneralSettings / SiteSetting)
      const settingsList = data.generalSettings || data.siteSettings || [];
      if (Array.isArray(settingsList) && settingsList.length > 0) {
        const s = settingsList[0];
        console.log('  🔄 Nạp cấu hình Thương hiệu & SEO...');
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

        await prisma.generalSettings.upsert({
          where: { id: s.id || 'default' },
          update: updatePayload,
          create: {
            id: s.id || 'default',
            ...updatePayload,
          },
        });

        try {
          await prisma.siteSetting.upsert({
            where: { id: s.id || 'default' },
            update: updatePayload,
            create: {
              id: s.id || 'default',
              ...updatePayload,
            },
          });
        } catch {}
      }

      // 1.7 Đồng bộ Cài đặt Thanh toán (PaymentConfig)
      if (Array.isArray(data.paymentConfigs) && data.paymentConfigs.length > 0) {
        const pm = data.paymentConfigs[0];
        console.log('  🔄 Nạp cài đặt Thanh toán & QR...');
        await prisma.paymentConfig.upsert({
          where: { id: pm.id || 'default' },
          update: {
            bankId: pm.bankId || 'TPB',
            bankName: pm.bankName || 'TPBank (Ngân hàng Tiên Phong)',
            accountNumber: pm.accountNumber || '0976619044',
            accountHolder: pm.accountHolder || 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
            isBankEnabled: pm.isBankEnabled !== undefined ? Boolean(pm.isBankEnabled) : true,
            momoPhone: pm.momoPhone || '0976619044',
            momoName: pm.momoName || 'CONG NGUYEN MACHINERY',
            momoQrUrl: pm.momoQrUrl || '/uploads/payment/momo-qr.webp',
            isMomoEnabled: pm.isMomoEnabled !== undefined ? Boolean(pm.isMomoEnabled) : true,
          },
          create: {
            id: pm.id || 'default',
            bankId: pm.bankId || 'TPB',
            bankName: pm.bankName || 'TPBank (Ngân hàng Tiên Phong)',
            accountNumber: pm.accountNumber || '0976619044',
            accountHolder: pm.accountHolder || 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
            isBankEnabled: pm.isBankEnabled !== undefined ? Boolean(pm.isBankEnabled) : true,
            momoPhone: pm.momoPhone || '0976619044',
            momoName: pm.momoName || 'CONG NGUYEN MACHINERY',
            momoQrUrl: pm.momoQrUrl || '/uploads/payment/momo-qr.webp',
            isMomoEnabled: pm.isMomoEnabled !== undefined ? Boolean(pm.isMomoEnabled) : true,
          },
        });
      }

      // 1.8 Đồng bộ Cấu hình Menu Header (NavigationSettings)
      if (Array.isArray(data.navigationSettings) && data.navigationSettings.length > 0) {
        const nav = data.navigationSettings[0];
        console.log('  🔄 Nạp cài đặt Menu Header (NavigationSettings)...');
        await prisma.navigationSettings.upsert({
          where: { id: nav.id || 'default' },
          update: {
            items: nav.items,
          },
          create: {
            id: nav.id || 'default',
            items: nav.items,
          },
        });
      }

      // 1.9 Đồng bộ Cấu hình Google Gemini AI (SystemSettings)
      if (Array.isArray(data.systemSettings) && data.systemSettings.length > 0) {
        const sys = data.systemSettings[0];
        console.log('  🔄 Nạp cài đặt Google Gemini AI (SystemSettings)...');
        await prisma.systemSettings.upsert({
          where: { id: sys.id || 'default' },
          update: {
            geminiApiKey: sys.geminiApiKey,
            isAiEnabled: sys.isAiEnabled ?? true,
            aiModelName: sys.aiModelName || 'gemini-2.5-flash',
            widgetRole: sys.widgetRole,
            systemPrompt: sys.systemPrompt,
            welcomeMessage: sys.welcomeMessage,
            isValidKey: sys.isValidKey,
            lastTestedAt: sys.lastTestedAt ? new Date(sys.lastTestedAt) : null,
          },
          create: {
            id: sys.id || 'default',
            geminiApiKey: sys.geminiApiKey,
            isAiEnabled: sys.isAiEnabled ?? true,
            aiModelName: sys.aiModelName || 'gemini-2.5-flash',
            widgetRole: sys.widgetRole,
            systemPrompt: sys.systemPrompt,
            welcomeMessage: sys.welcomeMessage,
            isValidKey: sys.isValidKey,
            lastTestedAt: sys.lastTestedAt ? new Date(sys.lastTestedAt) : null,
          },
        });
      }

      // 1.10 Đồng bộ Thông tin liên hệ (ContactSettings)
      if (Array.isArray(data.contactSettings) && data.contactSettings.length > 0) {
        const ct = data.contactSettings[0];
        console.log('  🔄 Nạp thông tin liên hệ (ContactSettings)...');
        await prisma.contactSettings.upsert({
          where: { id: ct.id || 'default' },
          update: {
            hotline: ct.hotline || '0976 619 044',
            zaloPhone: ct.zaloPhone || '0976 619 044',
            facebookUrl: ct.facebookUrl,
            emailContact: ct.emailContact,
            showroomAddress: ct.showroomAddress,
          },
          create: {
            id: ct.id || 'default',
            hotline: ct.hotline || '0976 619 044',
            zaloPhone: ct.zaloPhone || '0976 619 044',
            facebookUrl: ct.facebookUrl,
            emailContact: ct.emailContact,
            showroomAddress: ct.showroomAddress,
          },
        });
      }

      // 1.11 Đồng bộ Nội dung tĩnh (SiteContentSettings)
      if (Array.isArray(data.siteContentSettings) && data.siteContentSettings.length > 0) {
        const sc = data.siteContentSettings[0];
        console.log('  🔄 Nạp nội dung website (SiteContentSettings)...');
        await prisma.siteContentSettings.upsert({
          where: { id: sc.id || 'default' },
          update: {
            bannerTitle: sc.bannerTitle,
            bannerSubtitle: sc.bannerSubtitle,
            bannerButtonText: sc.bannerButtonText,
            bannerButtonLink: sc.bannerButtonLink,
            bannerHotline: sc.bannerHotline,
            footerCompanyName: sc.footerCompanyName,
            footerSlogan: sc.footerSlogan,
            footerDescription: sc.footerDescription,
            footerCopyright: sc.footerCopyright,
            featuredLinks: sc.featuredLinks,
          },
          create: {
            id: sc.id || 'default',
            bannerTitle: sc.bannerTitle,
            bannerSubtitle: sc.bannerSubtitle,
            bannerButtonText: sc.bannerButtonText,
            bannerButtonLink: sc.bannerButtonLink,
            bannerHotline: sc.bannerHotline,
            footerCompanyName: sc.footerCompanyName,
            footerSlogan: sc.footerSlogan,
            footerDescription: sc.footerDescription,
            footerCopyright: sc.footerCopyright,
            featuredLinks: sc.featuredLinks,
          },
        });
      }

      console.log('✅ Hoàn tất đồng bộ toàn bộ dữ liệu từ file JSON vào Database!');
      return;
    } catch (err: any) {
      console.warn(`⚠️ Lỗi khi nạp file data-backup.json: ${err.message}. Chuyển sang fallback seed mặc định...`);
    }
  }

  // ==========================================
  // FALLBACK SEED NẾU KHÔNG CÓ FILE BACKUP
  // ==========================================
  console.log('ℹ️ Sử dụng seed mặc định...');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
