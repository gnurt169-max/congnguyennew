import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Bắt đầu xuất toàn bộ dữ liệu từ Database Localhost sang file JSON...');

  // 1. Lấy danh mục
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // 2. Lấy thương hiệu
  const brands = await prisma.brand.findMany();

  // 3. Lấy sản phẩm kèm biến thể (variants)
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Lấy các bảng cấu hình hệ thống
  const homepageConfigs = await prisma.homepageConfig.findMany();
  const generalSettings = await prisma.generalSettings.findMany();
  const sectionVisibilities = await prisma.sectionVisibility.findMany();
  const navigationSettings = await prisma.navigationSettings.findMany();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalCategories: categories.length,
    totalBrands: brands.length,
    data: {
      categories,
      brands,
      products,
      homepageConfigs,
      generalSettings,
      sectionVisibilities,
      navigationSettings,
    },
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);

  // Ghi vào cả apps/backend/prisma/data-backup.json và prisma/data-backup.json
  const targetPaths = [
    path.join(__dirname, '..', 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'apps', 'backend', 'prisma', 'data-backup.json'),
    path.resolve(process.cwd(), 'prisma', 'data-backup.json'),
  ];

  for (const targetPath of targetPaths) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, jsonContent, 'utf-8');
      console.log(`  ✓ Đã ghi file sao lưu dữ liệu tại: ${targetPath}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Không thể ghi vào ${targetPath}: ${err.message}`);
    }
  }

  console.log(`✅ Xuất dữ liệu thành công! Đã sao lưu ${products.length} sản phẩm thực tế kèm ảnh WebP.`);
}

exportData()
  .catch((err) => {
    console.error('❌ Lỗi khi xuất dữ liệu:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

