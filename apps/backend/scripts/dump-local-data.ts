import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { toCleanRelativeUrl, cleanImagesArray } from './fix-image-urls';

const prisma = new PrismaClient();

async function dumpLocalData() {
  console.log('📦 [Dump Local Data] Đang quét và trích xuất toàn bộ dữ liệu từ Database Local...');

  // 1. Lấy danh mục máy
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // 2. Lấy thương hiệu
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
  });

  // 3. Lấy sản phẩm kèm biến thể (variants) & link ảnh WebP
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Lấy tất cả các bảng cài đặt & cấu hình Admin
  const generalSettings = await prisma.generalSettings.findMany();
  const siteSettings = await prisma.siteSetting.findMany();
  const paymentConfigs = await prisma.paymentConfig.findMany();
  const homepageConfigs = await prisma.homepageConfig.findMany();
  const sectionVisibilities = await prisma.sectionVisibility.findMany();
  const navigationSettings = await prisma.navigationSettings.findMany();
  const contactSettings = await prisma.contactSettings.findMany();
  const siteContentSettings = await prisma.siteContentSettings.findMany();

  // Chuẩn hoá triệt để đường dẫn ảnh sang Relative URL (không chứa localhost/domain tuyệt đối)
  const cleanedProducts = products.map((p) => {
    const cleanImg = toCleanRelativeUrl(p.imageUrl) || toCleanRelativeUrl(p.thumbnail);
    const cleanThumb = toCleanRelativeUrl(p.thumbnail) || toCleanRelativeUrl(p.imageUrl);
    const cleanImgs = cleanImagesArray(p.images);
    return {
      ...p,
      imageUrl: cleanImg,
      thumbnail: cleanThumb,
      images: cleanImgs,
    };
  });

  const cleanedPaymentConfigs = paymentConfigs.map((pay) => ({
    ...pay,
    momoQrUrl: toCleanRelativeUrl(pay.momoQrUrl) || pay.momoQrUrl,
  }));

  const cleanedHomepageConfigs = homepageConfigs.map((cfg) => ({
    ...cfg,
    featuredImageUrl: toCleanRelativeUrl(cfg.featuredImageUrl) || cfg.featuredImageUrl,
    founderAvatarUrl: toCleanRelativeUrl(cfg.founderAvatarUrl) || cfg.founderAvatarUrl,
  }));

  const cleanedCategories = categories.map((cat) => ({
    ...cat,
    imageUrl: toCleanRelativeUrl(cat.imageUrl) || cat.imageUrl,
  }));

  const cleanedBrands = brands.map((br) => ({
    ...br,
    logoUrl: toCleanRelativeUrl(br.logoUrl) || br.logoUrl,
  }));

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      totalProducts: cleanedProducts.length,
      totalCategories: cleanedCategories.length,
      totalBrands: cleanedBrands.length,
      hasPaymentConfig: cleanedPaymentConfigs.length > 0,
      hasGeneralSettings: generalSettings.length > 0,
    },
    data: {
      categories: cleanedCategories,
      brands: cleanedBrands,
      products: cleanedProducts,
      generalSettings,
      siteSettings,
      paymentConfigs: cleanedPaymentConfigs,
      homepageConfigs: cleanedHomepageConfigs,
      sectionVisibilities,
      navigationSettings,
      contactSettings,
      siteContentSettings,
    },
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);

  // Lưu file chính vào prisma/production-seed-data.json theo yêu cầu
  const targets = [
    path.resolve(process.cwd(), 'prisma', 'production-seed-data.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'production-seed-data.json'),
    path.resolve(process.cwd(), 'packages', 'database', 'data-sync.json'),
    path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
  ];

  for (const targetPath of targets) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, jsonContent, 'utf-8');
      console.log(`  ✓ Đã ghi file: ${targetPath}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Không thể ghi vào ${targetPath}: ${err.message}`);
    }
  }

  console.log(`\n✅ [Trích xuất hoàn tất!]`);
  console.log(`  - ${products.length} sản phẩm thực tế kèm link ảnh WebP đã được lưu vào prisma/production-seed-data.json`);
  console.log(`  - ${categories.length} danh mục & toàn bộ cấu hình thương hiệu/SEO đã sẵn sàng để đẩy lên GitHub.\n`);
}

dumpLocalData()
  .catch((err) => {
    console.error('❌ Lỗi khi xuất dữ liệu:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

