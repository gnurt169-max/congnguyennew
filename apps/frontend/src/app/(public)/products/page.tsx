import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductFilter, FilterCategory, FilterBrand } from '@/components/product/product-filter';
import { ProductCard, ProductListItem } from '@/components/product/product-card';
import { ProductToolbar } from '@/components/product/product-toolbar';
import { ProductPagination } from '@/components/product/product-pagination';
import { EmptyState } from '@/components/product/empty-state';
import { ChevronRight, Home } from 'lucide-react';
import { PowerType } from '@industrial-bakery/shared-types';
import { getApiBaseUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Danh Mục Thiết Bị Làm Bánh Công Nghiệp & Linh Kiện | Công Nguyên',
  description:
    'Xem danh mục máy trộn bột xoắn ốc Spiral 60L-200L, lò nướng tầng điện 3 pha, lò nướng xoay Rotary, máy chia vê bột tự động. Khảo sát nguồn điện và báo giá kỹ thuật RFQ tận nơi.',
  openGraph: {
    title: 'Danh Mục Thiết Bị Làm Bánh Công Nghiệp | Công Nguyên Bakery',
    description: 'Dây chuyền và máy móc làm bánh chuẩn công nghiệp châu Âu & Đài Loan.',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    q?: string;
    categorySlug?: string;
    category?: string;
    cat?: string;
    condition?: string;
    brandSlug?: string;
    brand?: string;
    powerType?: string;
    powerSource?: string;
    power?: string;
    isQuoteOnly?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    sortBy?: string;
    stockStatus?: string;
  };
}

// Fallback data dùng khi backend chưa chạy hoặc đang khởi động cục bộ
// Danh mục ngành thiết bị làm bánh của Công Nguyên (kèm danh mục rỗng để kiểm thử ẩn lọc)
const FALLBACK_CATEGORIES: FilterCategory[] = [
  { id: 'tu-trung-bay-banh', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh', _count: { products: 4 } },
  { id: 'lo-nuong-cong-nghiep', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep', _count: { products: 3 } },
  { id: 'may-tron-bot-danh-trung', name: 'Máy trộn bột & Đánh trứng', slug: 'may-tron-bot-danh-trung', _count: { products: 1 } },
  { id: 'thiet-bi-phu-tro', name: 'Thiết bị tạo hình & Phụ trợ', slug: 'thiet-bi-phu-tro', _count: { products: 0 } },
];

const FALLBACK_BRANDS: FilterBrand[] = [
  { id: '1', name: 'Ruyshing', slug: 'ruyshing', originCountry: 'Đài Loan', _count: { products: 4 } },
  { id: '2', name: 'Hobat', slug: 'hobat', originCountry: 'Đài Loan', _count: { products: 1 } },
  { id: '3', name: 'Hewwu', slug: 'hewwu', originCountry: 'Trung Quốc', _count: { products: 1 } },
  { id: '4', name: 'Southstar', slug: 'southstar', originCountry: 'Trung Quốc', _count: { products: 1 } },
];

const FALLBACK_PRODUCTS: ProductListItem[] = [
  {
    id: 'prod-ruyshing-1m5-5t',
    name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-150-5T',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 45000000,
    originalPrice: 97000000,
    summary: 'Tủ trưng bày bánh kem 1m5 5 tầng kính vuông Ruyshing Đài Loan, hệ sấy kính 4 mặt cao cấp chống đọng sương, máy tân trang bảo dưỡng kỹ thuật toàn diện.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Ruyshing', slug: 'ruyshing', originCountry: 'Đài Loan' },
    category: { name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    variants: [
      {
        id: 'var-1',
        sku: 'RS-150-5T-220V',
        name: 'Bản điện 220V 1m5 5 tầng',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 45000000,
      },
    ],
  },
  {
    id: 'prod-ruyshing-1m8-5t',
    name: 'Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan',
    modelCode: 'RS-180-5T',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 55000000,
    originalPrice: 118000000,
    summary: 'Còn 3 con: 2 màu đen, 1 màu kem',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Ruyshing (Đài Loan)', slug: 'ruyshing', originCountry: 'Đài Loan' },
    category: { name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    variants: [
      {
        id: 'var-2',
        sku: 'RS-180-5T-220V',
        name: 'Bản điện 220V 1m8 5 tầng (2 đen, 1 kem)',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 3,
        isQuoteOnly: false,
        price: 55000000,
      },
    ],
  },
  {
    id: 'prod-ruyshing-2canh-lua',
    name: 'Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan',
    slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan',
    modelCode: 'RS-2SL-COOL',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 38000000,
    originalPrice: 58000000,
    summary: 'Tủ mát công nghiệp 2 cánh lùa tiện lợi, tối ưu diện tích thao tác trong quầy, dàn lạnh đồng siêu bền.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Ruyshing (Đài Loan)', slug: 'ruyshing', originCountry: 'Đài Loan' },
    category: { name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    variants: [
      {
        id: 'var-3',
        sku: 'RS-2SL-220V',
        name: 'Bản 2 cánh lùa 220V',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 38000000,
      },
    ],
  },
  {
    id: 'prod-ruyshing-2canh-mo',
    name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
    modelCode: 'RS-2DR-STOR',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 24000000,
    originalPrice: 38000000,
    summary: 'Tủ 2 cánh mở bảo quản cốt bánh và nguyên liệu bánh, nhiệt độ giữ ẩm ổn định.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Ruyshing (Đài Loan)', slug: 'ruyshing', originCountry: 'Đài Loan' },
    category: { name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    variants: [
      {
        id: 'var-4',
        sku: 'RS-2DR-220V',
        name: 'Bản inox 2 cánh mở 220V',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 24000000,
      },
    ],
  },
  {
    id: 'prod-hobat-mixer',
    name: 'Cối đánh trứng / Trộn bột Đài Loan Hobat',
    slug: 'coi-danh-trung-tron-bot-dai-loan-hobat',
    modelCode: 'HB-30L-MIX',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 16000000,
    originalPrice: 24500000,
    summary: 'Cối đánh trứng và nhào bột công nghiệp bền bỉ của Hobat, đa tốc độ đánh kem, đánh trứng bông mịn.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Hobat (Đài Loan)', slug: 'hobat', originCountry: 'Đài Loan' },
    category: { name: 'Máy trộn bột & Đánh trứng', slug: 'may-tron-bot-danh-trung' },
    variants: [
      {
        id: 'var-5',
        sku: 'HB-30L-220V',
        name: 'Bản điện 220V cối 30L',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 16000000,
      },
    ],
  },
  {
    id: 'prod-hewwu-oven',
    name: 'Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc',
    slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc',
    modelCode: 'HW-1D2T',
    condition: 'REFURBISHED_FULL',
    isQuoteOnly: false,
    basePrice: 7000000,
    originalPrice: 10500000,
    summary: 'Lò nướng tầng điện thương hiệu Hewwu, 2 mặt lửa trên dưới tùy chỉnh độc lập, thích hợp nướng bánh bông lan, bánh trung thu, bánh mì.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Hewwu (Trung Quốc)', slug: 'hewwu', originCountry: 'Trung Quốc' },
    category: { name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    variants: [
      {
        id: 'var-6',
        sku: 'HW-1D2T-220V',
        name: 'Bản điện 220V 1 tầng 2 khay',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 7000000,
      },
    ],
  },
  {
    id: 'prod-convection-4tray-new',
    name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
    slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
    modelCode: 'CV-4T-NEW',
    condition: 'LIKE_NEW_99',
    isQuoteOnly: false,
    basePrice: 10000000,
    originalPrice: 18000000,
    summary: 'Lò nướng đối lưu 4 khay mới tinh chưa qua sử dụng, có quạt gió tuần hoàn giúp vỏ bánh chín vàng đều màu, xả kho giá sốc.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Trung Quốc', slug: 'trung-quoc', originCountry: 'Trung Quốc' },
    category: { name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    variants: [
      {
        id: 'var-7',
        sku: 'CV-4T-220V',
        name: 'Bản điện 220V 4 mâm 40x60 (Mới 100% xả thanh lý)',
        powerType: PowerType.SINGLE_PHASE_220V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 10000000,
      },
    ],
  },
  {
    id: 'prod-southstar-4tray-90',
    name: 'Lò nướng đối lưu Southstar 4 mâm',
    slug: 'lo-nuong-doi-luu-southstar-4-mam',
    modelCode: 'SS-4M-90',
    condition: 'EXCELLENT_90_95',
    isQuoteOnly: false,
    basePrice: 25000000,
    originalPrice: 35000000,
    summary: 'Lò nướng đối lưu 4 mâm thương hiệu nổi tiếng Southstar, có chế độ phun sương tạo ẩm, vỏ máy inox sáng đẹp, mới 90%.',
    warrantyMonths: 12,
    thumbnail: null,
    brand: { name: 'Southstar', slug: 'southstar', originCountry: 'Trung Quốc' },
    category: { name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    variants: [
      {
        id: 'var-8',
        sku: 'SS-4M-380V',
        name: 'Bản điện 380V / 220V 4 mâm (Mới 90%)',
        powerType: PowerType.THREE_PHASE_380V,
        stockQuantity: 1,
        isQuoteOnly: false,
        price: 25000000,
      },
    ],
  },
];

async function getProductsData(searchParams: ProductsPageProps['searchParams']) {
  const baseUrl = getApiBaseUrl();
  const query = new URLSearchParams();

  // Đồng bộ đầy đủ các tham số lọc: category, condition, powerSource, search, sort...
  const cat = searchParams.category || searchParams.categorySlug || searchParams.cat;
  if (cat) {
    query.set('category', cat);
    query.set('categorySlug', cat);
  }
  if (searchParams.condition) {
    query.set('condition', searchParams.condition);
  }
  const power = searchParams.powerSource || searchParams.powerType || searchParams.power;
  if (power) {
    query.set('powerSource', power);
    query.set('powerType', power);
  }
  const search = searchParams.search || searchParams.q;
  if (search) {
    query.set('search', search);
  }
  const brand = searchParams.brand || searchParams.brandSlug;
  if (brand) {
    query.set('brand', brand);
    query.set('brandSlug', brand);
  }
  if (searchParams.minPrice) query.set('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) query.set('maxPrice', searchParams.maxPrice);
  if (searchParams.isQuoteOnly) query.set('isQuoteOnly', searchParams.isQuoteOnly);
  if (searchParams.sort || searchParams.sortBy) {
    const s = searchParams.sort || searchParams.sortBy;
    if (s) query.set('sort', s);
  }
  // Mặc định là 'in_stock' để chỉ hiển thị máy còn trong kho, trừ khi người dùng chủ động chọn 'all'
  const stockStatus = searchParams.stockStatus || 'in_stock';
  query.set('stockStatus', stockStatus);

  if (searchParams.page) query.set('page', searchParams.page);
  if (searchParams.limit) query.set('limit', searchParams.limit);

  try {
    const [resProducts, resCategories, resBrands] = await Promise.all([
      fetch(`${baseUrl}/products?${query.toString()}`, {
        cache: 'no-store',
        next: { tags: ['products-list', 'products'], revalidate: 0 },
      }),
      fetch(`${baseUrl}/categories`, {
        next: { tags: ['categories-list'], revalidate: 3600 },
      }),
      fetch(`${baseUrl}/brands`, {
        next: { tags: ['brands-list'], revalidate: 3600 },
      }),
    ]);

    const jsonProducts = resProducts.ok ? await resProducts.json() : null;
    const jsonCategories = resCategories.ok ? await resCategories.json() : null;
    const jsonBrands = resBrands.ok ? await resBrands.json() : null;

    const products: ProductListItem[] = jsonProducts?.data || FALLBACK_PRODUCTS;
    const total: number = jsonProducts?.meta?.total ?? products.length;
    const page: number = jsonProducts?.meta?.page ?? 1;
    const limit: number = jsonProducts?.meta?.limit ?? 10;
    const totalPages: number = jsonProducts?.meta?.totalPages ?? (Math.ceil(total / limit) || 1);

    const rawCategories: FilterCategory[] = jsonCategories?.data || FALLBACK_CATEGORIES;
    const brands: FilterBrand[] = jsonBrands?.data || FALLBACK_BRANDS;

    // Tự động đếm và đồng bộ số lượng sản phẩm thực tế theo từng danh mục
    const categoryCountMap: Record<string, number> = {};
    products.forEach((p) => {
      const slug = p.category?.slug;
      if (slug) {
        categoryCountMap[slug] = (categoryCountMap[slug] || 0) + 1;
      }
    });

    const categories: FilterCategory[] = rawCategories.map((c) => {
      const count =
        typeof c._count?.products === 'number' && c._count.products > 0
          ? c._count.products
          : (categoryCountMap[c.slug] || 0);
      return {
        ...c,
        _count: { products: count },
      };
    });

    return { products, total, page, limit, totalPages, categories, brands };
  } catch (error) {
    // Graceful fallback nếu Backend API chưa chạy
    console.warn('Backend API chưa sẵn sàng, áp dụng bộ lọc trên dữ liệu thực tế:', error);

    let filtered = [...FALLBACK_PRODUCTS];
    const activeCat = searchParams.category || searchParams.categorySlug || searchParams.cat;
    if (activeCat) {
      let slugToMatch = activeCat;
      if (slugToMatch === 'may-tron-bot') slugToMatch = 'may-tron-bot-danh-trung';
      else if (slugToMatch === 'tu-trung-bay') slugToMatch = 'tu-trung-bay-banh';
      else if (slugToMatch === 'lo-nuong') slugToMatch = 'lo-nuong-cong-nghiep';

      filtered = filtered.filter((p) => p.category?.slug === slugToMatch || p.category?.slug === activeCat);
    }
    if (searchParams.condition) {
      filtered = filtered.filter((p) => p.condition === searchParams.condition);
    }
    const power = searchParams.powerSource || searchParams.powerType || searchParams.power;
    if (power) {
      const lowerPower = power.toLowerCase();
      filtered = filtered.filter((p) =>
        p.variants.some((v) => {
          const pt = String(v.powerType || '');
          if (lowerPower.includes('380') && (pt.includes('380') || pt.includes('THREE_PHASE'))) return true;
          if (lowerPower.includes('220') && (pt.includes('220') || pt.includes('SINGLE_PHASE'))) return true;
          return pt === power || v.name.toLowerCase().includes(lowerPower);
        }),
      );
    }
    if (searchParams.brandSlug || searchParams.brand) {
      const b = (searchParams.brandSlug || searchParams.brand)!.toLowerCase();
      filtered = filtered.filter((p) => p.brand?.slug === b || p.brand?.name.toLowerCase().includes(b));
    }
    if (searchParams.isQuoteOnly !== undefined) {
      const isQuote = searchParams.isQuoteOnly === 'true';
      filtered = filtered.filter((p) => p.isQuoteOnly === isQuote);
    }
    if (searchParams.minPrice) {
      filtered = filtered.filter((p) => Number(p.basePrice) >= Number(searchParams.minPrice));
    }
    if (searchParams.maxPrice) {
      filtered = filtered.filter((p) => Number(p.basePrice) <= Number(searchParams.maxPrice));
    }
    const q = searchParams.search || searchParams.q;
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.modelCode?.toLowerCase().includes(lower) ||
          p.summary?.toLowerCase().includes(lower) ||
          p.brand?.name.toLowerCase().includes(lower),
      );
    }
    const sortVal = searchParams.sort || searchParams.sortBy;
    if (sortVal === 'price_asc') {
      filtered.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortVal === 'price_desc') {
      filtered.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else if (sortVal === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    return {
      products: filtered,
      total: filtered.length,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(filtered.length / 10) || 1,
      categories: FALLBACK_CATEGORIES,
      brands: FALLBACK_BRANDS,
    };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { products, total, page, totalPages, categories, brands } =
    await getProductsData(searchParams);

  // JSON-LD Structured Data Schema cho SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Danh Mục Thiết Bị Làm Bánh Công Nghiệp',
    description: 'Danh sách máy móc làm bánh, lò nướng bánh mì, máy trộn bột xoắn ốc Spiral.',
    numberOfItems: products.length,
    itemListElement: products.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `/products/${item.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
      {/* Thẻ JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB NAVIGATION */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-amber-600"
          >
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">Danh mục thiết bị</span>
          {(() => {
            const activeCat = searchParams.categorySlug || searchParams.category || searchParams.cat;
            if (!activeCat) return null;
            return (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-amber-700">
                  {categories.find((c) => c.slug === activeCat)?.name || activeCat}
                </span>
              </>
            );
          })()}
        </nav>

        {/* HEADER SECTION */}
        <div className="mt-4 flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Thiết Bị Làm Bánh Công Nghiệp
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Lò nướng xoay, máy trộn bột Spiral, tủ ủ vi khí hậu và phụ kiện làm bánh chính hãng. Hỗ trợ khảo sát điện 3 pha và nghiệm thu thực địa.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-800">
              ⚡ Hỗ trợ trả góp & cọc nhiều đợt
            </span>
          </div>
        </div>

        {/* MAIN LAYOUT: SIDEBAR BỘ LỌC + LƯỚI SẢN PHẨM */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* SIDEBAR BỘ LỌC (CLIENT COMPONENT) */}
          <ProductFilter categories={categories} brands={brands} />

          {/* CỘT NỘI DUNG SẢN PHẨM */}
          <main className="flex-1 space-y-6">
            {/* THANH ĐIỀU KHIỂN: TÌM KIẾM, SẮP XẾP, TỔNG SỐ */}
            <ProductToolbar totalCount={total} />

            {/* LƯỚI SẢN PHẨM HOẶC EMPTY STATE (2 CỘT TRÊN MOBILE) */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* PHÂN TRANG */}
                <ProductPagination currentPage={page} totalPages={totalPages} />
              </>
            ) : (
              <EmptyState />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
