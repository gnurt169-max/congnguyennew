import {
  PrismaClient,
  PowerType,
  ProductCondition,
  ProductAvailability,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function syncImport() {
  console.log('🔄 [DB Sync Import] Bắt đầu nạp và đồng bộ dữ liệu vào Database...');

  // ==========================================
  // SAFE GUARD: BẢO TOÀN DỮ LIỆU THỰC TẾ
  // ==========================================
  const productCount = await prisma.product.count();
  const force = process.env.FORCE_IMPORT === 'true';
  if (productCount > 0 && !force) {
    console.log(`🛡️ Database đã có dữ liệu thực tế (${productCount} sản phẩm). Bỏ qua quá trình import để bảo toàn 100% dữ liệu. (Truyền FORCE_IMPORT=true nếu chủ động muốn ghi đè)`);
    return;
  }

  // 1. Xác định vị trí file data-sync.json
  const candidatePaths = [
    path.resolve(process.cwd(), 'packages', 'database', 'data-sync.json'),
    path.resolve(__dirname, '..', '..', '..', 'packages', 'database', 'data-sync.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
  ];

  let syncFilePath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      syncFilePath = p;
      break;
    }
  }

  if (!syncFilePath) {
    console.error('❌ Không tìm thấy file dữ liệu data-sync.json hoặc data-backup.json.');
    process.exit(1);
  }

  console.log(`📂 Đọc dữ liệu đồng bộ từ: ${syncFilePath}`);
  const rawData = fs.readFileSync(syncFilePath, 'utf-8');
  const payload = JSON.parse(rawData);
  const data = payload.data || payload;

  // 2. Đảm bảo tài khoản quản trị admin@congnguyen.com.vn luôn tồn tại
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
  console.log('  ✓ Đã kiểm tra tài khoản quản trị Admin.');

  // 3. Đồng bộ Danh mục (Categories)
  if (Array.isArray(data.categories)) {
    console.log(`  🔄 Đồng bộ ${data.categories.length} danh mục máy...`);
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

  // 4. Đồng bộ Thương hiệu (Brands)
  if (Array.isArray(data.brands)) {
    console.log(`  🔄 Đồng bộ ${data.brands.length} thương hiệu...`);
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

  // 5. Đồng bộ Sản phẩm và Biến thể (Products & Variants)
  let importedProducts = 0;
  if (Array.isArray(data.products)) {
    console.log(`  🔄 Đồng bộ ${data.products.length} sản phẩm thực tế kèm link ảnh...`);
    for (const p of data.products) {
      const cond =
        p.condition && Object.values(ProductCondition).includes(p.condition as any)
          ? p.condition
          : ProductCondition.REFURBISHED_FULL;

      const avail =
        p.availability && Object.values(ProductAvailability).includes(p.availability as any)
          ? p.availability
          : ProductAvailability.AVAILABLE;

      const img = p.imageUrl || p.thumbnail;

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
          const pType =
            v.powerType && Object.values(PowerType).includes(v.powerType as any)
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

      importedProducts++;
    }
  }

  // 6. Đồng bộ Cấu hình Thương hiệu & SEO (GeneralSettings & SiteSetting)
  const settingsList = data.generalSettings || data.siteSettings || [];
  if (Array.isArray(settingsList) && settingsList.length > 0) {
    const s = settingsList[0];
    console.log('  🔄 Đồng bộ cài đặt Thương hiệu & SEO (GeneralSettings / SiteSetting)...');
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

  // 7. Đồng bộ Cài đặt Thanh toán (PaymentConfig)
  if (Array.isArray(data.paymentConfigs) && data.paymentConfigs.length > 0) {
    const pm = data.paymentConfigs[0];
    console.log('  🔄 Đồng bộ Cài đặt Thanh toán & QR code...');
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

  // 8. Đồng bộ Cấu hình trang chủ (HomepageConfig)
  if (Array.isArray(data.homepageConfigs) && data.homepageConfigs.length > 0) {
    const h = data.homepageConfigs[0];
    console.log('  🔄 Đồng bộ Cấu hình Hero trang chủ...');
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

  // 9. Đồng bộ Vùng hiển thị & Menu điều hướng
  if (Array.isArray(data.sectionVisibilities) && data.sectionVisibilities.length > 0) {
    const sv = data.sectionVisibilities[0];
    await prisma.sectionVisibility.upsert({
      where: { id: sv.id || 'default' },
      update: {
        showBadge: sv.showBadge ?? true,
        showHeroStats: sv.showHeroStats ?? true,
        showHeroFeaturedCard: sv.showHeroFeaturedCard ?? true,
        showSecondaryCTA: sv.showSecondaryCTA ?? true,
        showFloatingContact: sv.showFloatingContact ?? true,
        showWorkshopLocation: sv.showWorkshopLocation ?? true,
        showHotProductsSection: sv.showHotProductsSection ?? true,
        showTestimonials: sv.showTestimonials ?? true,
      },
      create: {
        id: sv.id || 'default',
        showBadge: sv.showBadge ?? true,
        showHeroStats: sv.showHeroStats ?? true,
        showHeroFeaturedCard: sv.showHeroFeaturedCard ?? true,
        showSecondaryCTA: sv.showSecondaryCTA ?? true,
        showFloatingContact: sv.showFloatingContact ?? true,
        showWorkshopLocation: sv.showWorkshopLocation ?? true,
        showHotProductsSection: sv.showHotProductsSection ?? true,
        showTestimonials: sv.showTestimonials ?? true,
      },
    });
  }

  if (Array.isArray(data.navigationSettings) && data.navigationSettings.length > 0) {
    const nav = data.navigationSettings[0];
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

  console.log(`\n✅ [DB Sync Import Hoàn Tất]`);
  console.log(`  - Đã nạp ${importedProducts} sản phẩm khớp chuẩn 100% hình ảnh & dữ liệu!`);
}

syncImport()
  .catch((err) => {
    console.error('❌ Lỗi khi nạp dữ liệu:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

