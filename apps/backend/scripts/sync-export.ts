import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function syncExport() {
  console.log('🚀 [DB Sync Export] Đang quét và xuất toàn bộ dữ liệu từ Database localhost...');

  // 1. Lấy danh mục
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // 2. Lấy thương hiệu
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
  });

  // 3. Lấy sản phẩm kèm biến thể (variants)
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Lấy các bảng cài đặt & cấu hình
  const generalSettings = await prisma.generalSettings.findMany();
  const siteSettings = await prisma.siteSetting.findMany();
  const systemSettings = await prisma.systemSettings.findMany();
  const paymentConfigs = await prisma.paymentConfig.findMany();
  const homepageConfigs = await prisma.homepageConfig.findMany();
  const sectionVisibilities = await prisma.sectionVisibility.findMany();
  const navigationSettings = await prisma.navigationSettings.findMany();
  const contactSettings = await prisma.contactSettings.findMany();
  const siteContentSettings = await prisma.siteContentSettings.findMany();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    stats: {
      products: products.length,
      categories: categories.length,
      brands: brands.length,
    },
    data: {
      categories,
      brands,
      products,
      generalSettings,
      siteSettings,
      systemSettings,
      paymentConfigs,
      homepageConfigs,
      sectionVisibilities,
      navigationSettings,
      contactSettings,
      siteContentSettings,
    },
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);

  // Đường dẫn chính và các bản sao lưu để seed tự động nhận diện
  const targets = [
    path.resolve(process.cwd(), 'packages', 'database', 'data-sync.json'),
    path.resolve(process.cwd(), 'prisma', 'initial-data.json'),
    path.resolve(process.cwd(), 'prisma', 'production-seed-data.json'),
    path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'initial-data.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'production-seed-data.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
  ];

  for (const targetPath of targets) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, jsonContent, 'utf-8');
      console.log(`  ✓ Đã lưu file: ${targetPath}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Không thể ghi file ${targetPath}: ${err.message}`);
    }
  }

  const primaryFile = targets[0];
  console.log(`\n✅ [DB Sync Export Hoàn Tất]`);
  console.log(`  - Tổng số sản phẩm: ${products.length}`);
  console.log(`  - Danh mục: ${categories.length}`);
  console.log(`  - Cấu hình thương hiệu & SEO: ${generalSettings.length} bản ghi`);
  console.log(`  - File chính: ${primaryFile}\n`);
}

syncExport()
  .catch((err) => {
    console.error('❌ Lỗi khi xuất dữ liệu:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

