import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Hàm chuẩn hoá và chuyển đổi mọi URL ảnh về Relative Path chuẩn duy nhất:
 * - Cắt bỏ hoàn toàn domain cục bộ: http://localhost:4000, http://localhost:3000, http://127.0.0.1:4000
 * - Bóc tách đường dẫn tĩnh bắt đầu bằng /uploads/...
 * - Tránh hoàn toàn việc trình duyệt kích hoạt cảnh báo Private Network Access
 */
export function toCleanRelativeUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Nếu chứa chuỗi con /uploads/... thì trích xuất ngay relative path
  const uploadsMatch = trimmed.match(/\/uploads\/.+$/);
  if (uploadsMatch) {
    return uploadsMatch[0];
  }

  // 2. Nếu bắt đầu bằng uploads/... không có gạch chéo đầu
  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  // 3. Cắt bỏ tiền tố localhost / 127.0.0.1 / domain tuyệt đối bất kỳ trỏ về uploads
  let cleaned = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');

  if (cleaned.startsWith('uploads/')) {
    cleaned = `/${cleaned}`;
  }

  if (cleaned.startsWith('/')) {
    return cleaned;
  }

  return cleaned;
}

export function cleanImagesArray(images: any): any {
  if (!images) return images;
  if (Array.isArray(images)) {
    return images.map((item) => {
      if (typeof item === 'string') {
        return toCleanRelativeUrl(item) || item;
      }
      if (item && typeof item === 'object') {
        const copy = { ...item };
        if (typeof copy.url === 'string') {
          copy.url = toCleanRelativeUrl(copy.url) || copy.url;
        }
        return copy;
      }
      return item;
    });
  }
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return cleanImagesArray(parsed);
      }
    } catch {
      return toCleanRelativeUrl(images) || images;
    }
  }
  return images;
}

async function fixImageUrls() {
  console.log('🚀 [Fix Image URLs] Bắt đầu quét & chuyển đổi toàn bộ đường dẫn ảnh sang Relative Path...');

  let totalUpdated = 0;

  // 1. Quét & chuẩn hoá bảng Product
  const products = await prisma.product.findMany();
  console.log(`🔍 Tìm thấy ${products.length} sản phẩm trong Database. Kiểm tra từng bản ghi...`);

  for (const prod of products) {
    let changed = false;

    const oldImageUrl = prod.imageUrl;
    const oldThumbnail = prod.thumbnail;
    const oldImages = prod.images;

    const newImageUrl = toCleanRelativeUrl(oldImageUrl);
    const newThumbnail = toCleanRelativeUrl(oldThumbnail);
    const newImages = cleanImagesArray(oldImages);

    if (newImageUrl !== oldImageUrl) changed = true;
    if (newThumbnail !== oldThumbnail) changed = true;
    if (JSON.stringify(newImages) !== JSON.stringify(oldImages)) changed = true;

    if (changed) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          imageUrl: newImageUrl || newThumbnail,
          thumbnail: newThumbnail || newImageUrl,
          images: newImages as any,
        },
      });
      totalUpdated++;
      console.log(`  ✓ Đã sửa Product [${prod.name}] -> thumbnail: ${newThumbnail || newImageUrl}`);
    }
  }

  // 2. Quét bảng HomepageConfig
  const homepageConfigs = await prisma.homepageConfig.findMany();
  for (const cfg of homepageConfigs) {
    let changed = false;
    const newFounderAvatar = toCleanRelativeUrl(cfg.founderAvatarUrl);
    const newFeatured = toCleanRelativeUrl(cfg.featuredImageUrl);

    if (newFounderAvatar !== cfg.founderAvatarUrl) changed = true;
    if (newFeatured !== cfg.featuredImageUrl) changed = true;

    if (changed) {
      await prisma.homepageConfig.update({
        where: { id: cfg.id },
        data: {
          founderAvatarUrl: newFounderAvatar,
          featuredImageUrl: newFeatured || '',
        },
      });
      console.log(`  ✓ Đã sửa HomepageConfig (ID: ${cfg.id})`);
    }
  }

  // 3. Quét bảng PaymentConfig
  const paymentConfigs = await prisma.paymentConfig.findMany();
  for (const pay of paymentConfigs) {
    let changed = false;
    const newQr = toCleanRelativeUrl(pay.momoQrUrl);

    if (newQr !== pay.momoQrUrl) {
      changed = true;
    }

    if (changed) {
      await prisma.paymentConfig.update({
        where: { id: pay.id },
        data: {
          momoQrUrl: newQr,
        },
      });
      console.log(`  ✓ Đã sửa PaymentConfig (ID: ${pay.id}) -> momoQrUrl: ${newQr}`);
    }
  }

  // 4. Quét bảng Category
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.imageUrl) {
      const newImg = toCleanRelativeUrl(cat.imageUrl);
      if (newImg !== cat.imageUrl) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { imageUrl: newImg },
        });
        console.log(`  ✓ Đã sửa Category [${cat.name}] -> imageUrl: ${newImg}`);
      }
    }
  }

  // 5. Quét bảng Brand
  const brands = await prisma.brand.findMany();
  for (const br of brands) {
    if (br.logoUrl) {
      const newLogo = toCleanRelativeUrl(br.logoUrl);
      if (newLogo !== br.logoUrl) {
        await prisma.brand.update({
          where: { id: br.id },
          data: { logoUrl: newLogo },
        });
        console.log(`  ✓ Đã sửa Brand [${br.name}] -> logoUrl: ${newLogo}`);
      }
    }
  }

  // 6. Quét bảng SiteSetting & GeneralSettings
  try {
    const siteSettings = await (prisma as any).siteSetting?.findMany();
    if (siteSettings) {
      for (const site of siteSettings) {
        // Kiểm tra xem có trường image/avatar/logo nào không
        let siteChanged = false;
        const updates: any = {};
        for (const [key, val] of Object.entries(site)) {
          if (typeof val === 'string' && (val.includes('http://localhost') || val.includes('http://127.0.0.1'))) {
            updates[key] = toCleanRelativeUrl(val);
            siteChanged = true;
          }
        }
        if (siteChanged) {
          await (prisma as any).siteSetting.update({
            where: { id: site.id },
            data: updates,
          });
          console.log(`  ✓ Đã sửa SiteSetting (ID: ${site.id})`);
        }
      }
    }
  } catch (err: any) {
    console.log(`  ℹ SiteSetting check skipped: ${err.message}`);
  }

  console.log(`\n🎉 [Hoàn thành!] Đã kiểm tra và chuẩn hoá xong toàn bộ dữ liệu. Tổng số sản phẩm đã cập nhật: ${totalUpdated}.`);
}

fixImageUrls()
  .catch((err) => {
    console.error('❌ Lỗi khi thực thi fix-image-urls:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

