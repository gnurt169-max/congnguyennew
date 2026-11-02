import {
  PrismaClient,
  PowerType,
  ProductCondition,
  ProductAvailability,
} from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Bắt đầu quá trình Migration: Kiểm tra an toàn dữ liệu...');

  // ==========================================
  // SAFE GUARD: BẢO TOÀN DỮ LIỆU THỰC TẾ
  // ==========================================
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log(`🛡️ Database đã có dữ liệu thực tế (${productCount} sản phẩm). Bỏ qua quá trình migrate/wipe để bảo toàn 100% dữ liệu.`);
    return;
  }

  // ==========================================
  // 1. DỌN SẠCH DỮ LIỆU CŨ (ĐÃ VÔ HIỆU HÓA ĐỂ BẢO VỆ DỮ LIỆU)
  // ==========================================
  try {
    // Vô hiệu hóa toàn bộ lệnh deleteMany để bảo vệ dữ liệu theo yêu cầu
    // await prisma.quotationItem.deleteMany({});
    // await prisma.variantAttributeValue.deleteMany({});
    // await prisma.productVariant.deleteMany({});
    // await prisma.product.deleteMany({});
    // await prisma.category.deleteMany({...});
    console.log('🛡️ Các lệnh xóa bảng đã được vô hiệu hóa để bảo vệ an toàn dữ liệu.');
  } catch (err) {
    console.error('❌ Lỗi:', err);
    throw err;
  }

  // ==========================================
  // 2. KHỞI TẠO CÂY DANH MỤC CHUẨN (3 DANH MỤC CHÍNH)
  // ==========================================
  const catDisplay = await prisma.category.upsert({
    where: { slug: 'tu-trung-bay-banh' },
    update: {
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      description: 'Tủ bánh kem kính đứng 1m5, 1m8 5 tầng, tủ mát 2 cánh lùa, tủ bảo quản 2 cánh mở Ruyshing Đài Loan.',
      sortOrder: 1,
      isActive: true,
    },
    create: {
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      slug: 'tu-trung-bay-banh',
      description: 'Tủ bánh kem kính đứng 1m5, 1m8 5 tầng, tủ mát 2 cánh lùa, tủ bảo quản 2 cánh mở Ruyshing Đài Loan.',
      sortOrder: 1,
      isActive: true,
    },
  });

  const catOvens = await prisma.category.upsert({
    where: { slug: 'lo-nuong-cong-nghiep' },
    update: {
      name: 'Lò nướng bánh công nghiệp',
      description: 'Lò nướng điện 1 tầng 2 khay Hewwu, lò nướng đối lưu 4 mâm Trung Quốc mới 100%, lò nướng đối lưu Southstar 4 mâm.',
      sortOrder: 2,
      isActive: true,
    },
    create: {
      name: 'Lò nướng bánh công nghiệp',
      slug: 'lo-nuong-cong-nghiep',
      description: 'Lò nướng điện 1 tầng 2 khay Hewwu, lò nướng đối lưu 4 mâm Trung Quốc mới 100%, lò nướng đối lưu Southstar 4 mâm.',
      sortOrder: 2,
      isActive: true,
    },
  });

  const catMixers = await prisma.category.upsert({
    where: { slug: 'may-tron-bot-danh-trung' },
    update: {
      name: 'Máy trộn bột & Đánh trứng',
      description: 'Cối đánh trứng / Trộn bột Đài Loan Hobat bền bỉ, đa tốc độ đánh kem, đánh trứng, nhào bột.',
      sortOrder: 3,
      isActive: true,
    },
    create: {
      name: 'Máy trộn bột & Đánh trứng',
      slug: 'may-tron-bot-danh-trung',
      description: 'Cối đánh trứng / Trộn bột Đài Loan Hobat bền bỉ, đa tốc độ đánh kem, đánh trứng, nhào bột.',
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('✅ Đã thiết lập 3 danh mục chính:');
  console.log(`  1. ${catDisplay.name} (${catDisplay.slug})`);
  console.log(`  2. ${catOvens.name} (${catOvens.slug})`);
  console.log(`  3. ${catMixers.name} (${catMixers.slug})`);

  // ==========================================
  // THƯƠNG HIỆU (BRANDS)
  // ==========================================
  const brandRuyshing = await prisma.brand.upsert({
    where: { slug: 'ruyshing' },
    update: { name: 'Ruyshing (Đài Loan)', originCountry: 'Đài Loan' },
    create: {
      name: 'Ruyshing (Đài Loan)',
      slug: 'ruyshing',
      originCountry: 'Đài Loan',
      description: 'Thương hiệu tủ bánh kem và tủ mát bảo quản hàng đầu Đài Loan.',
    },
  });

  const brandHobat = await prisma.brand.upsert({
    where: { slug: 'hobat' },
    update: { name: 'Hobat (Đài Loan)', originCountry: 'Đài Loan' },
    create: {
      name: 'Hobat (Đài Loan)',
      slug: 'hobat',
      originCountry: 'Đài Loan',
      description: 'Thương hiệu máy trộn bột và cối đánh trứng đa năng Đài Loan bền bỉ.',
    },
  });

  const brandHewwu = await prisma.brand.upsert({
    where: { slug: 'hewwu' },
    update: { name: 'Hewwu (Trung Quốc)', originCountry: 'Trung Quốc' },
    create: {
      name: 'Hewwu (Trung Quốc)',
      slug: 'hewwu',
      originCountry: 'Trung Quốc',
      description: 'Thương hiệu lò nướng điện tầng nướng bánh chuyên nghiệp.',
    },
  });

  const brandChina = await prisma.brand.upsert({
    where: { slug: 'trung-quoc' },
    update: { name: 'Trung Quốc', originCountry: 'Trung Quốc' },
    create: {
      name: 'Trung Quốc',
      slug: 'trung-quoc',
      originCountry: 'Trung Quốc',
      description: 'Lò nướng đối lưu công nghiệp sản xuất tại Trung Quốc.',
    },
  });

  const brandSouthstar = await prisma.brand.upsert({
    where: { slug: 'southstar' },
    update: { name: 'Southstar', originCountry: 'Trung Quốc' },
    create: {
      name: 'Southstar',
      slug: 'southstar',
      originCountry: 'Trung Quốc',
      description: 'Thương hiệu lò nướng đối lưu và thiết bị làm bánh danh tiếng.',
    },
  });

  // ==========================================
  // 3. NẠP ĐÚNG 8 SẢN PHẨM THỰC TẾ
  // ==========================================
  const productsToSeed = [
    {
      name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
      slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
      modelCode: 'RS-150-5T',
      categoryId: catDisplay.id,
      brandId: brandRuyshing.id,
      originalPrice: 97000000,
      price: 45000000,
      status: 'available',
      conditionText: 'Tân trang nguyên bản',
      conditionEnum: ProductCondition.REFURBISHED_FULL,
      stock: 1,
      description: 'Tủ bánh kem kính đứng 1m5 gồm 5 tầng trưng bày, sấy kính chống đọng sương, block làm lạnh nhập khẩu Đài Loan chạy cực êm và bền bỉ.',
      thumbnail: '/uploads/products/tu-banh-kem-1m5-ruyshing.webp',
      sku: 'RS-150-5T-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan',
      slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan',
      modelCode: 'RS-180-5T',
      categoryId: catDisplay.id,
      brandId: brandRuyshing.id,
      originalPrice: 118000000,
      price: 55000000,
      status: 'available',
      conditionText: 'Máy tân trang như mới',
      conditionEnum: ProductCondition.REFURBISHED_FULL,
      stock: 3,
      note: 'Còn 3 con: 2 màu đen, 1 màu kem',
      description: 'Dòng tủ lớn 1m8 cao cấp 5 tầng kính đứng, dung tích rộng rãi, sấy kính 4 mặt, phù hợp tiệm bánh quy mô lớn. Còn 3 con: 2 màu đen, 1 màu kem.',
      thumbnail: '/uploads/products/tu-banh-kem-1m8-ruyshing.webp',
      sku: 'RS-180-5T-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan',
      slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan',
      modelCode: 'RS-2SL-COOL',
      categoryId: catDisplay.id,
      brandId: brandRuyshing.id,
      originalPrice: 58000000,
      price: 38000000,
      status: 'available',
      conditionText: 'Nguyên bản hoạt động hoàn hảo',
      conditionEnum: ProductCondition.LIKE_NEW_99,
      stock: 1,
      description: 'Tủ mát công nghiệp 2 cánh lùa tiện lợi, tối ưu diện tích thao tác trong quầy, dàn lạnh đồng siêu bền.',
      thumbnail: '/uploads/products/tu-mat-2-canh-lua-ruyshing.webp',
      sku: 'RS-2SL-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
      slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
      modelCode: 'RS-2DR-STOR',
      categoryId: catDisplay.id,
      brandId: brandRuyshing.id,
      originalPrice: 38000000,
      price: 24000000,
      status: 'available',
      conditionText: 'Tân trang đạt chuẩn kỹ thuật',
      conditionEnum: ProductCondition.REFURBISHED_FULL,
      stock: 1,
      description: 'Tủ 2 cánh mở bảo quản cốt bánh và nguyên liệu bánh, nhiệt độ giữ ẩm ổn định.',
      thumbnail: '/uploads/products/tu-bao-quan-2-canh-mo-ruyshing.webp',
      sku: 'RS-2DR-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Cối đánh trứng / Trộn bột Đài Loan Hobat',
      slug: 'coi-danh-trung-tron-bot-dai-loan-hobat',
      modelCode: 'HB-30L-MIX',
      categoryId: catMixers.id,
      brandId: brandHobat.id,
      originalPrice: 24500000,
      price: 16000000,
      status: 'available',
      conditionText: 'Máy nguyên bản, motor dây đồng cực khỏe',
      conditionEnum: ProductCondition.REFURBISHED_FULL,
      stock: 1,
      description: 'Cối đánh trứng và nhào bột công nghiệp bền bỉ của Hobat, đa tốc độ đánh kem, đánh trứng bông mịn.',
      thumbnail: '/uploads/products/coi-danh-trung-hobat.webp',
      sku: 'HB-30L-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc',
      slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc',
      modelCode: 'HW-1D2T',
      categoryId: catOvens.id,
      brandId: brandHewwu.id,
      originalPrice: 10500000,
      price: 7000000,
      status: 'available',
      conditionText: 'Thanh lý tiệm bánh, nhiệt lên đều',
      conditionEnum: ProductCondition.FAIR_80,
      stock: 1,
      description: 'Lò nướng tầng điện thương hiệu Hewwu, 2 mặt lửa trên dưới tùy chỉnh độc lập, thích hợp nướng bánh bông lan, bánh trung thu, bánh mì.',
      thumbnail: '/uploads/products/lo-nuong-hewwu.webp',
      sku: 'HW-1D2T-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
      slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
      modelCode: 'CV-4T-NEW',
      categoryId: catOvens.id,
      brandId: brandChina.id,
      originalPrice: 18000000,
      price: 10000000,
      status: 'available',
      conditionText: 'Hàng mới 100% xả thanh lý kho',
      conditionEnum: ProductCondition.LIKE_NEW_99,
      stock: 1,
      description: 'Lò nướng đối lưu 4 khay mới tinh chưa qua sử dụng, có quạt gió tuần hoàn giúp vỏ bánh chín vàng đều màu, xả kho giá sốc.',
      thumbnail: '/uploads/products/lo-nuong-doi-luu-4-mam-trung-quoc.webp',
      sku: 'CV-4T-220V',
      powerType: PowerType.SINGLE_PHASE_220V,
    },
    {
      name: 'Lò nướng đối lưu Southstar 4 mâm',
      slug: 'lo-nuong-doi-luu-southstar-4-mam',
      modelCode: 'SS-4M-90',
      categoryId: catOvens.id,
      brandId: brandSouthstar.id,
      originalPrice: 35000000,
      price: 25000000,
      status: 'available',
      conditionText: 'Độ mới 90%',
      conditionEnum: ProductCondition.EXCELLENT_90_95,
      stock: 1,
      description: 'Lò nướng đối lưu 4 mâm thương hiệu nổi tiếng Southstar, có chế độ phun sương tạo ẩm, vỏ máy inox sáng đẹp, mới 90%.',
      thumbnail: '/uploads/products/lo-nuong-southstar.webp',
      sku: 'SS-4M-380V',
      powerType: PowerType.THREE_PHASE_380V,
    },
  ];

  for (const item of productsToSeed) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        modelCode: item.modelCode,
        categoryId: item.categoryId,
        brandId: item.brandId,
        originalPrice: item.originalPrice,
        basePrice: item.price,
        minPrice: item.price,
        maxPrice: item.price,
        condition: item.conditionEnum,
        availability: ProductAvailability.AVAILABLE,
        stock: item.stock || 1,
        soldCount: 0,
        status: item.status || 'available',
        refurbishDetails: item.conditionText,
        summary: item.note || item.description,
        description: item.description,
        imageUrl: item.thumbnail,
        thumbnail: item.thumbnail,
        images: [item.thumbnail],
        warrantyMonths: 12,
        isQuoteOnly: false,
        isActive: true,
        variants: {
          create: {
            sku: item.sku,
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            stockQuantity: item.stock,
            powerType: item.powerType,
            isActive: true,
          },
        },
      },
    });

    console.log(`📦 Đã nạp thành công: ${product.name} (Giá: ${item.price.toLocaleString('vi-VN')} đ)`);
  }

  console.log('\n🎉 Quá trình Migration hoàn tất mỹ mãn!');
  console.log('Tổng số sản phẩm hiện hành trong DB: 8 thiết bị bánh thanh lý.');
}

runMigration()
  .catch((err) => {
    console.error('Lỗi migration:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
