import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetailView, ProductDetailData } from '@/components/product/product-detail-view';
import { ChevronRight, Home } from 'lucide-react';
import { PowerType, ProductCondition, ProductAvailability } from '@industrial-bakery/shared-types';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { getApiBaseUrl } from '@/lib/utils';

export interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fallback data dùng khi backend chưa chạy hoặc đang khởi động cục bộ
// Fallback data dùng khi backend chưa chạy hoặc đang khởi động cục bộ
const FALLBACK_DETAIL_PRODUCTS: Record<string, ProductDetailData> = {
  'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan': {
    id: 'prod-ruyshing-1m5-5t',
    name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-1M5-5T',
    isQuoteOnly: false,
    basePrice: 45000000,
    originalPrice: 97000000,
    currency: 'VND',
    condition: ProductCondition.REFURBISHED_FULL,
    availability: ProductAvailability.AVAILABLE,
    refurbishDetails: 'Tân trang nguyên bản',
    stock: 1,
    summary: 'Tủ bánh kem kính đứng 1m5 gồm 5 tầng trưng bày, sấy kính chống đọng sương, block làm lạnh nhập khẩu Đài Loan chạy cực êm và bền bỉ.',
    description: `
      <h3>Tủ trưng bày bánh kem đứng 1m5 cao cấp từ thương hiệu Ruyshing Đài Loan</h3>
      <p>Dòng tủ chuyên dụng cho tiệm bánh ngọt, quán cà phê và nhà hàng cao cấp. Thiết kế kính vuông đứng sang trọng với 5 tầng trưng bày diện tích cực rộng, hệ thống sấy kính 4 mặt chống mờ sương tuyệt đối.</p>
      <h4>Hạng mục kỹ thuật đã kiểm tra & tân trang xưởng Công Nguyên:</h4>
      <ul>
        <li><strong>Block làm lạnh:</strong> Kiểm tra áp suất gas R134a, chạy êm ái, độ lạnh sâu 2°C - 8°C ổn định.</li>
        <li><strong>Hệ thống sấy kính:</strong> Dây sấy kính điện trở hoạt động hoàn hảo cả 4 mặt kính.</li>
        <li><strong>Đèn LED trưng bày:</strong> Trang bị dải LED vàng ấm tôn màu bánh kem bắt mắt.</li>
      </ul>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Ruyshing (Đài Loan)',
      slug: 'ruyshing',
      originCountry: 'Đài Loan',
      description: 'Nhà sản xuất tủ mát và tủ trưng bày bánh kem cao cấp Đài Loan.',
    },
    category: {
      id: 'cat-tu-trung-bay',
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      slug: 'tu-trung-bay-banh',
    },
    variants: [
      {
        id: 'var-ruyshing-1m5',
        sku: 'RS-1M5-220V',
        name: 'Ruyshing 1m5 5 Tầng (220V)',
        price: 45000000,
        originalPrice: 97000000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 0.95,
        weightKg: 220,
        dimensions: '1500 x 750 x 1800 mm',
      },
    ],
  },
  'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan': {
    id: 'prod-ruyshing-1m8-5t',
    name: 'Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-1M8-5T',
    isQuoteOnly: false,
    basePrice: 55000000,
    originalPrice: 118000000,
    currency: 'VND',
    condition: ProductCondition.REFURBISHED_FULL,
    availability: ProductAvailability.AVAILABLE,
    refurbishDetails: 'Máy tân trang như mới',
    stock: 3,
    note: 'Còn 3 con: 2 màu đen, 1 màu kem',
    summary: 'Dòng tủ lớn 1m8 cao cấp 5 tầng kính đứng, dung tích rộng rãi, sấy kính 4 mặt, phù hợp tiệm bánh quy mô lớn.',
    description: `
      <h3>Tủ bánh kem lớn 1m8 Ruyshing - Lựa chọn hoàn hảo cho tiệm bánh lớn</h3>
      <p>Kho Công Nguyên hiện có sẵn 3 máy tân trang đẹp 95-98% (2 màu đen hiện đại, 1 màu kem cổ điển). Máy đã qua quy trình kiểm tra bo mạch, nạp gas và thử tải nhiệt độ nghiêm ngặt.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Ruyshing (Đài Loan)',
      slug: 'ruyshing',
      originCountry: 'Đài Loan',
    },
    category: {
      id: 'cat-tu-trung-bay',
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      slug: 'tu-trung-bay-banh',
    },
    variants: [
      {
        id: 'var-ruyshing-1m8',
        sku: 'RS-1M8-220V',
        name: 'Ruyshing 1m8 5 Tầng (220V)',
        price: 55000000,
        originalPrice: 118000000,
        stockQuantity: 3,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 1.2,
        weightKg: 260,
        dimensions: '1800 x 750 x 1800 mm',
      },
    ],
  },
  'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan': {
    id: 'prod-ruyshing-2canh-lua',
    name: 'Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan',
    slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan',
    modelCode: 'RS-2LUA',
    isQuoteOnly: false,
    basePrice: 38000000,
    originalPrice: 58000000,
    currency: 'VND',
    condition: ProductCondition.REFURBISHED_FULL,
    availability: ProductAvailability.AVAILABLE,
    refurbishDetails: 'Nguyên bản hoạt động hoàn hảo',
    stock: 1,
    summary: 'Tủ mát công nghiệp 2 cánh lùa tiện lợi, tối ưu diện tích thao tác trong quầy, dàn lạnh đồng siêu bền.',
    description: `
      <h3>Tủ mát bảo quản 2 cánh lùa Ruyshing nguyên bản</h3>
      <p>Cửa lùa trượt mượt mà, gioăng từ hít chặt hạn chế thất thoát nhiệt tối đa khi mở liên tục trong quầy bánh.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Ruyshing (Đài Loan)',
      slug: 'ruyshing',
      originCountry: 'Đài Loan',
    },
    category: {
      id: 'cat-tu-trung-bay',
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      slug: 'tu-trung-bay-banh',
    },
    variants: [
      {
        id: 'var-ruyshing-2lua',
        sku: 'RS-2LUA-220V',
        name: 'Ruyshing 2 Cánh Lùa (220V)',
        price: 38000000,
        originalPrice: 58000000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 0.65,
        weightKg: 140,
      },
    ],
  },
  'tu-bao-quan-2-canh-mo-ruyshing-dai-loan': {
    id: 'prod-ruyshing-2canh-mo',
    name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
    modelCode: 'RS-2MO',
    isQuoteOnly: false,
    basePrice: 24000000,
    originalPrice: 38000000,
    currency: 'VND',
    condition: ProductCondition.REFURBISHED_FULL,
    availability: ProductAvailability.AVAILABLE,
    refurbishDetails: 'Tân trang đạt chuẩn kỹ thuật',
    stock: 1,
    summary: 'Tủ 2 cánh mở bảo quản cốt bánh và nguyên liệu bánh, nhiệt độ giữ ẩm ổn định.',
    description: `
      <h3>Tủ 2 cánh mở Ruyshing bảo quản bánh chuyên nghiệp</h3>
      <p>Dàn lạnh đồng nguyên chất 100%, nhiệt độ giữ ẩm ổn định bảo vệ kết cấu cốt bánh không bị khô.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Ruyshing (Đài Loan)',
      slug: 'ruyshing',
      originCountry: 'Đài Loan',
    },
    category: {
      id: 'cat-tu-trung-bay',
      name: 'Tủ trưng bày bánh kem & Bảo quản',
      slug: 'tu-trung-bay-banh',
    },
    variants: [
      {
        id: 'var-ruyshing-2mo',
        sku: 'RS-2MO-220V',
        name: 'Ruyshing 2 Cánh Mở (220V)',
        price: 24000000,
        originalPrice: 38000000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 0.55,
        weightKg: 125,
      },
    ],
  },
  'coi-danh-trung-tron-bot-dai-loan-hobat': {
    id: 'prod-hobat-mixer',
    name: 'Cối đánh trứng / Trộn bột Đài Loan Hobat',
    slug: 'coi-danh-trung-tron-bot-dai-loan-hobat',
    modelCode: 'HOBAT-20L',
    isQuoteOnly: false,
    basePrice: 16000000,
    originalPrice: 24500000,
    currency: 'VND',
    condition: ProductCondition.REFURBISHED_FULL,
    availability: ProductAvailability.AVAILABLE,
    refurbishDetails: 'Máy nguyên bản, motor dây đồng cực khỏe',
    stock: 1,
    summary: 'Cối đánh trứng và nhào bột công nghiệp bền bỉ của Hobat, đa tốc độ đánh kem, đánh trứng bông mịn.',
    description: `
      <h3>Máy đánh trứng / Trộn bột công nghiệp Hobat Đài Loan</h3>
      <p>Động cơ dây đồng nguyên chất, cơ cấu truyền động bánh răng thép tôi cứng siêu bền bỉ, kèm đầy đủ 3 càng: lồng đánh trứng, mái chèo đánh kem và móc nhào bột.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Hobat (Đài Loan)',
      slug: 'hobat',
      originCountry: 'Đài Loan',
    },
    category: {
      id: 'cat-may-tron-bot',
      name: 'Máy trộn bột & Đánh trứng',
      slug: 'may-tron-bot-danh-trung',
    },
    variants: [
      {
        id: 'var-hobat-20l',
        sku: 'HOBAT-20L-220V',
        name: 'Cối Hobat 20L (220V)',
        price: 16000000,
        originalPrice: 24500000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 1.1,
        weightKg: 85,
      },
    ],
  },
  'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc': {
    id: 'prod-hewwu-oven',
    name: 'Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc',
    slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc',
    modelCode: 'HW-1T2K',
    isQuoteOnly: false,
    basePrice: 7000000,
    originalPrice: 10500000,
    currency: 'VND',
    condition: ProductCondition.FAIR_80,
    refurbishDetails: 'Thanh lý tiệm bánh, nhiệt lên đều',
    stock: 1,
    summary: 'Lò nướng tầng điện thương hiệu Hewwu, 2 mặt lửa trên dưới tùy chỉnh độc lập, thích hợp nướng bánh bông lan, bánh trung thu, bánh mì.',
    description: `
      <h3>Lò nướng điện tầng Hewwu 1 tầng 2 khay</h3>
      <p>Kiểm soát nhiệt độ trên dưới độc lập từ 20°C - 300°C. Thân lò bọc bảo ôn cách nhiệt dầy, tiết kiệm điện năng tối đa.</p>
    `,
    warrantyMonths: 6,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Hewwu (Trung Quốc)',
      slug: 'hewwu',
      originCountry: 'Trung Quốc',
    },
    category: {
      id: 'cat-lo-nuong',
      name: 'Lò nướng bánh công nghiệp',
      slug: 'lo-nuong-cong-nghiep',
    },
    variants: [
      {
        id: 'var-hewwu-1t2k',
        sku: 'HW-1T2K-220V',
        name: 'Hewwu 1 Tầng 2 Khay (220V)',
        price: 7000000,
        originalPrice: 10500000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 6.6,
        weightKg: 95,
      },
    ],
  },
  'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100': {
    id: 'prod-convection-4tray-new',
    name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
    slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
    modelCode: 'DL-4M-NEW',
    isQuoteOnly: false,
    basePrice: 10000000,
    originalPrice: 18000000,
    currency: 'VND',
    condition: ProductCondition.LIKE_NEW_99,
    refurbishDetails: 'Hàng mới 100% xả thanh lý kho',
    stock: 1,
    summary: 'Lò nướng đối lưu 4 khay mới tinh chưa qua sử dụng, có quạt gió tuần hoàn giúp vỏ bánh chín vàng đều màu, xả kho giá sốc.',
    description: `
      <h3>Lò nướng đối lưu 4 khay mới 100% thanh lý xả kho</h3>
      <p>Máy nguyên đai nguyên kiện, tích hợp quạt đối lưu tuần hoàn khí nóng đa chiều, vỏ bánh chín giòn vàng đều màu.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Trung Quốc',
      slug: 'trung-quoc',
      originCountry: 'Trung Quốc',
    },
    category: {
      id: 'cat-lo-nuong',
      name: 'Lò nướng bánh công nghiệp',
      slug: 'lo-nuong-cong-nghiep',
    },
    variants: [
      {
        id: 'var-dl-4m',
        sku: 'DL-4M-220V',
        name: 'Lò Đối Lưu 4 Mâm (220V)',
        price: 10000000,
        originalPrice: 18000000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 4.5,
        weightKg: 75,
      },
    ],
  },
  'lo-nuong-doi-luu-southstar-4-mam': {
    id: 'prod-southstar-convection-4m',
    name: 'Lò nướng đối lưu Southstar 4 mâm',
    slug: 'lo-nuong-doi-luu-southstar-4-mam',
    modelCode: 'NFC-4D',
    isQuoteOnly: false,
    basePrice: 25000000,
    originalPrice: 35000000,
    currency: 'VND',
    condition: ProductCondition.EXCELLENT_90_95,
    refurbishDetails: 'Độ mới 90%',
    stock: 1,
    summary: 'Lò nướng đối lưu 4 mâm thương hiệu nổi tiếng Southstar, có chế độ phun sương tạo ẩm, vỏ máy inox sáng đẹp, mới 90%.',
    description: `
      <h3>Lò nướng đối lưu 4 mâm Southstar cao cấp có phun ẩm</h3>
      <p>Thương hiệu Southstar nổi danh về độ bền bỉ trong ngành làm bánh. Chức năng phun sương tự động giúp nướng bánh mì vỏ giòn xốp và bánh ngọt không bị khô.</p>
    `,
    warrantyMonths: 12,
    thumbnail: null,
    images: [],
    brand: {
      name: 'Southstar',
      slug: 'southstar',
      originCountry: 'Trung Quốc',
    },
    category: {
      id: 'cat-lo-nuong',
      name: 'Lò nướng bánh công nghiệp',
      slug: 'lo-nuong-cong-nghiep',
    },
    variants: [
      {
        id: 'var-southstar-4m',
        sku: 'NFC-4D-220V',
        name: 'Southstar 4 Mâm Phun Ẩm (220V)',
        price: 25000000,
        originalPrice: 35000000,
        stockQuantity: 1,
        isQuoteOnly: false,
        powerType: PowerType.SINGLE_PHASE_220V,
        powerKw: 6.0,
        weightKg: 130,
      },
    ],
  },
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = params;
  let product: ProductDetailData | null = null;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/products/${slug}`, {
      cache: 'no-store',
      next: { tags: ['products', 'products-list', `product-${slug}`], revalidate: 0 },
    });
    if (res.ok) {
      const envelope = await res.json();
      product = envelope.data;
    }
  } catch {
    product = FALLBACK_DETAIL_PRODUCTS[slug] || null;
  }

  if (!product && FALLBACK_DETAIL_PRODUCTS[slug]) {
    product = FALLBACK_DETAIL_PRODUCTS[slug];
  }

  if (!product) {
    return {
      title: 'Không tìm thấy máy móc thanh lý | Công Nguyên Refurbished',
      description: 'Thiết bị làm bánh công nghiệp thanh lý & tân trang.',
    };
  }

  const title = `${product.name} | Thiết bị làm bánh thanh lý & tân trang`;
  const description =
    product.summary ||
    `Mua máy ${product.name} đã qua sử dụng, tân trang toàn diện linh kiện SKF/Bando, bảo hành 12 tháng tại xưởng.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;
  let product: ProductDetailData | null = null;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/products/${slug}`, {
      cache: 'no-store',
      next: { tags: ['products', 'products-list', `product-${slug}`], revalidate: 0 },
    });
    if (res.ok) {
      const envelope = await res.json();
      product = envelope.data;
    }
  } catch {
    // Backend chưa sẵn sàng, dùng fallback
    product = FALLBACK_DETAIL_PRODUCTS[slug] || null;
  }

  if (!product && FALLBACK_DETAIL_PRODUCTS[slug]) {
    product = FALLBACK_DETAIL_PRODUCTS[slug];
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB ĐIỀU HƯỚNG */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1">
          <Link href="/" className="flex items-center gap-1 hover:text-amber-700 transition">
            <Home className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/products" className="hover:text-amber-700 transition">
            Kho máy thanh lý & tân trang
          </Link>
          {product.category?.parent && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <Link
                href={`/products?category=${product.category.parent.slug}`}
                className="hover:text-amber-700 transition"
              >
                {product.category.parent.name}
              </Link>
            </>
          )}
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-amber-700 transition"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* SCHEMA JSON-LD PRODUCT (CHUẨN GOOGLE MERCHANT & RICH RESULTS) & BREADCRUMB */}
        <ProductJsonLd product={product} />
        <BreadcrumbJsonLd
          items={[
            { name: 'Trang chủ', url: '/' },
            { name: 'Kho máy thanh lý & tân trang', url: '/products' },
            { name: product.name, url: `/products/${product.slug}` },
          ]}
        />

        {/* COMPONENT HIỂN THỊ CHI TIẾT & TƯƠNG TÁC (CLIENT COMPONENT) */}
        <ProductDetailView product={product} />
      </div>
    </div>
  );
}
