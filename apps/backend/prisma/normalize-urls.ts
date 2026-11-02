import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper loại bỏ domain tuyệt đối (localhost:4000, 127.0.0.1, congnguyen.com.vn)
 * và chỉ giữ lại relative URL bắt đầu bằng /uploads/...
 */
export function cleanRelativeUploadUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/\/uploads\/.+$/);
  if (match) {
    return match[0];
  }
  return trimmed;
}

async function main() {
  console.log('🔄 Bắt đầu chuẩn hoá toàn bộ URL ảnh trong cơ sở dữ liệu sang Relative URL...');

  // 1. Quét bảng Product
  const products = await prisma.product.findMany();
  let updatedProductsCount = 0;

  for (const prod of products) {
    let changed = false;
    let newThumbnail = prod.thumbnail;
    let newImages = prod.images;

    if (prod.thumbnail) {
      const cleaned = cleanRelativeUploadUrl(prod.thumbnail);
      if (cleaned !== prod.thumbnail) {
        newThumbnail = cleaned;
        changed = true;
      }
    }

    if (Array.isArray(prod.images)) {
      const cleanedImages = prod.images.map((im: any) => {
        if (typeof im === 'string') {
          return cleanRelativeUploadUrl(im);
        }
        if (im && typeof im === 'object' && im.url) {
          return { ...im, url: cleanRelativeUploadUrl(im.url) };
        }
        return im;
      });

      if (JSON.stringify(cleanedImages) !== JSON.stringify(prod.images)) {
        newImages = cleanedImages;
        changed = true;
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          imageUrl: newThumbnail,
          thumbnail: newThumbnail,
          images: newImages as any,
        },
      });
      updatedProductsCount++;
      console.log(`  ✓ Đã chuẩn hoá sản phẩm: ${prod.name} (${prod.id})`);
    }
  }

  // 2. Quét bảng HomepageConfig
  const homepageConfigs = await prisma.homepageConfig.findMany();
  for (const cfg of homepageConfigs) {
    let changed = false;
    let newAvatar = cfg.founderAvatarUrl;
    let newFeatured = cfg.featuredImageUrl;

    if (cfg.founderAvatarUrl) {
      const cleaned = cleanRelativeUploadUrl(cfg.founderAvatarUrl);
      if (cleaned !== cfg.founderAvatarUrl) {
        newAvatar = cleaned;
        changed = true;
      }
    }

    if (cfg.featuredImageUrl) {
      const cleaned = cleanRelativeUploadUrl(cfg.featuredImageUrl);
      if (cleaned !== cfg.featuredImageUrl) {
        newFeatured = cleaned || '';
        changed = true;
      }
    }

    if (changed) {
      await prisma.homepageConfig.update({
        where: { id: cfg.id },
        data: {
          founderAvatarUrl: newAvatar,
          featuredImageUrl: newFeatured,
        },
      });
      console.log(`  ✓ Đã chuẩn hoá HomepageConfig (ID: ${cfg.id})`);
    }
  }

  // 3. Quét bảng Category
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.imageUrl) {
      const cleaned = cleanRelativeUploadUrl(cat.imageUrl);
      if (cleaned !== cat.imageUrl) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { imageUrl: cleaned },
        });
        console.log(`  ✓ Đã chuẩn hoá Category: ${cat.name}`);
      }
    }
  }

  // 4. Quét bảng Brand
  const brands = await prisma.brand.findMany();
  for (const br of brands) {
    if (br.logoUrl) {
      const cleaned = cleanRelativeUploadUrl(br.logoUrl);
      if (cleaned !== br.logoUrl) {
        await prisma.brand.update({
          where: { id: br.id },
          data: { logoUrl: cleaned },
        });
        console.log(`  ✓ Đã chuẩn hoá Brand: ${br.name}`);
      }
    }
  }

  console.log(`✅ Hoàn tất chuẩn hoá! Đã cập nhật ${updatedProductsCount} sản phẩm sang Relative URL.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chuẩn hoá URL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
