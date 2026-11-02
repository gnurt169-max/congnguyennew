'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Clock,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Flame,
  Wrench,
} from 'lucide-react';
import { formatVND, normalizeImagePath, getApiBaseUrl } from '@/lib/utils';

export interface RecentProductItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string | null;
  originalPrice?: number | string | null;
  condition?: string | null;
  refurbishDetails?: string | null;
  stock?: number;
  note?: string;
  availability?: string;
  imageUrl?: string | null;
  thumbnail?: string | null;
  createdAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// Danh mục 8 sản phẩm thực tế chuẩn của CÔNG NGUYÊN (Không dùng ảnh demo cũ)
const FALLBACK_RECENT_PRODUCTS: RecentProductItem[] = [
  {
    id: 'prod-ruyshing-1m5-5t',
    name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
    basePrice: 45000000,
    originalPrice: 97000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Tân trang nguyên bản',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    brand: { id: 'b-ruyshing', name: 'Ruyshing', slug: 'ruyshing' },
  },
  {
    id: 'prod-ruyshing-1m8-5t',
    name: 'Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan',
    basePrice: 55000000,
    originalPrice: 118000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Máy tân trang như mới',
    stock: 3,
    note: '⚡ Chỉ còn 3 máy kho Đông Hưng Thuận (2 đen, 1 kem)',
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    brand: { id: 'b-ruyshing', name: 'Ruyshing (Đài Loan)', slug: 'ruyshing' },
  },
  {
    id: 'prod-ruyshing-2canh-lua',
    name: 'Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan',
    slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan',
    basePrice: 38000000,
    originalPrice: 58000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Nguyên bản hoạt động hoàn hảo',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    brand: { id: 'b-ruyshing', name: 'Ruyshing (Đài Loan)', slug: 'ruyshing' },
  },
  {
    id: 'prod-ruyshing-2canh-mo',
    name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
    basePrice: 24000000,
    originalPrice: 38000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Tân trang đạt chuẩn kỹ thuật',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    brand: { id: 'b-ruyshing', name: 'Ruyshing (Đài Loan)', slug: 'ruyshing' },
  },
  {
    id: 'prod-hobat-mixer',
    name: 'Cối đánh trứng / Trộn bột Đài Loan Hobat',
    slug: 'coi-danh-trung-tron-bot-dai-loan-hobat',
    basePrice: 16000000,
    originalPrice: 24500000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Máy nguyên bản, motor dây đồng cực khỏe',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    category: { id: 'cat-may-tron', name: 'Máy trộn bột & Đánh trứng', slug: 'may-tron-bot-danh-trung' },
    brand: { id: 'b-hobat', name: 'Hobat (Đài Loan)', slug: 'hobat' },
  },
  {
    id: 'prod-hewwu-oven',
    name: 'Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc',
    slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc',
    basePrice: 7000000,
    originalPrice: 10500000,
    condition: 'FAIR_80',
    refurbishDetails: 'Thanh lý tiệm bánh, nhiệt lên đều',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    brand: { id: 'b-hewwu', name: 'Hewwu (Trung Quốc)', slug: 'hewwu' },
  },
  {
    id: 'prod-convection-4tray-new',
    name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
    slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
    basePrice: 10000000,
    originalPrice: 18000000,
    condition: 'LIKE_NEW_99',
    refurbishDetails: 'Hàng mới 100% xả thanh lý kho',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    brand: { id: 'b-china', name: 'Trung Quốc', slug: 'trung-quoc' },
  },
  {
    id: 'prod-southstar-4tray-90',
    name: 'Lò nướng đối lưu Southstar 4 mâm',
    slug: 'lo-nuong-doi-luu-southstar-4-mam',
    basePrice: 25000000,
    originalPrice: 35000000,
    condition: 'EXCELLENT_90_95',
    refurbishDetails: 'Độ mới 90%',
    stock: 1,
    availability: 'AVAILABLE',
    thumbnail: null,
    createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    brand: { id: 'b-southstar', name: 'Southstar', slug: 'southstar' },
  },
];

function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Vừa xong';
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

function getConditionDisplay(condition?: string | null, details?: string | null) {
  if (details && details.trim().length > 0) {
    return { label: details, badgeClass: 'bg-amber-500 text-slate-950 font-black border-amber-400' };
  }
  switch (condition) {
    case 'LIKE_NEW_99':
      return { label: 'Mới 100% / 99%', badgeClass: 'bg-emerald-600 text-white font-black border-emerald-400' };
    case 'EXCELLENT_90_95':
      return { label: 'Độ mới 90%', badgeClass: 'bg-blue-600 text-white font-black border-blue-400' };
    case 'FAIR_80':
      return { label: 'Thanh lý tiệm bánh', badgeClass: 'bg-slate-800 text-white font-bold border-slate-700' };
    case 'REFURBISHED_FULL':
    default:
      return { label: 'Tân trang chuẩn xưởng', badgeClass: 'bg-amber-500 text-slate-950 font-black border-amber-400' };
  }
}

export function LatestListingsSection({
  initialProducts,
}: {
  initialProducts?: RecentProductItem[];
} = {}) {
  const [products, setProducts] = useState<RecentProductItem[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : FALLBACK_RECENT_PRODUCTS,
  );
  const [isLoading, setIsLoading] = useState(!initialProducts || initialProducts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Trích xuất danh sách danh mục tự động gom nhóm theo cấu hình Admin
  const categoryTabs = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    products.forEach((p) => {
      if (p.category?.name) {
        const key = p.category.slug || p.category.name;
        if (!map.has(key)) {
          map.set(key, {
            id: p.category.id || key,
            name: p.category.name,
            slug: p.category.slug || key,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => {
      return (
        p.category?.slug === selectedCategory ||
        p.category?.name === selectedCategory ||
        (p.category?.name && p.category.name.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    });
  }, [products, selectedCategory]);

  const fetchRecentProducts = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      // 1. Thử gọi qua API route Next.js /api/products/recent?limit=8
      const res = await fetch('/api/products/recent?limit=8', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data || [];
        if (items.length > 0) {
          setProducts(items);
          setLastUpdated(new Date());
          return;
        }
      }

      // 2. Fallback sang API backend trực tiếp (an toàn với relative URL)
      const baseUrl = getApiBaseUrl();
      const backendRes = await fetch(`${baseUrl}/products/recent?limit=8`, { cache: 'no-store' });
      if (backendRes.ok) {
        const json = await backendRes.json();
        const items = Array.isArray(json) ? json : json.data || [];
        if (items.length > 0) {
          setProducts(items);
          setLastUpdated(new Date());
          return;
        }
      }

      // 3. Fallback danh sách mẫu hiển thị hấp dẫn
      setProducts(FALLBACK_RECENT_PRODUCTS);
    } catch {
      setProducts(FALLBACK_RECENT_PRODUCTS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch ban đầu khi component mount nếu chưa có dữ liệu từ Server Component
  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      fetchRecentProducts();
    }

    // Tự động refetch định kỳ mỗi 60 giây để cập nhật món mới đăng
    const interval = setInterval(() => {
      fetchRecentProducts();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchRecentProducts, initialProducts]);

  return (
    <section className="relative bg-slate-50/60 py-14 lg:py-20 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER KHỐI */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-black tracking-wider uppercase text-amber-700">
              <Flame className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
              <span>Thiết Bị Mới Về Kho</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Thanh Lý Máy Làm Bánh Cũ Đã Tân Trang Chuẩn Xưởng
            </h2>

            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Kho máy làm bánh công nghiệp thanh lý & thiết bị làm bánh tân trang tuyển chọn độ mới 90% – 99%, tiết kiệm 40% – 60% chi phí đầu tư. Đã qua quy trình rã máy kiểm tra, thay bi SKF, test tải thực tế trước khi xuất xưởng!
            </p>
          </div>

          {/* NÚT THAO TÁC: LÀM MỚI REALTIME & XEM TẤT CẢ */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchRecentProducts(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition disabled:opacity-60 cursor-pointer"
              title="Cập nhật sản phẩm vừa đăng mới"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
            >
              <span>Xem tất cả kho hàng</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* BỘ LỌC TỰ ĐỘNG GOM NHÓM THEO DANH MỤC SẢN PHẨM */}
        {categoryTabs.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tất cả máy mới về ({products.length})
            </button>
            {categoryTabs.map((tab) => {
              const count = products.filter(
                (p) => p.category?.slug === tab.slug || p.category?.name === tab.name,
              ).length;
              const isSelected = selectedCategory === tab.slug || selectedCategory === tab.name;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.slug || tab.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* LƯỚI SẢN PHẨM MỚI (LATEST LISTINGS GRID) */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="aspect-[4/3] rounded-xl bg-slate-200" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-4 h-8 rounded-xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-3 text-base font-bold text-slate-800">Không có thiết bị nào thuộc nhóm danh mục này</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng chọn tab khác hoặc bấm "Tất cả máy mới về".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((item) => {
                const conditionInfo = getConditionDisplay(item.condition, item.refurbishDetails);

                const basePriceNum = typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : Number(item.basePrice || 0);
                const origPriceNum = typeof item.originalPrice === 'string' ? parseFloat(item.originalPrice) : Number(item.originalPrice || 0);

                const hasDiscount = origPriceNum > basePriceNum && basePriceNum > 0;
                const savingsAmount = hasDiscount ? origPriceNum - basePriceNum : 0;
                const discountPercent = hasDiscount ? Math.round((savingsAmount / origPriceNum) * 100) : 0;

                const isSold = item.availability === 'SOLD';
                const scarcityText =
                  item.note ||
                  (item.stock && item.stock <= 3
                    ? `⚡ Chỉ còn ${item.stock} máy kho Đông Hưng Thuận`
                    : '⚡ Chỉ còn 1 máy kho Đông Hưng Thuận');

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div>
                      {/* KHỐI HÌNH ẢNH ASPECT 4:3 */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        {/* CHỈ DÙNG ẢNH THẬT, HOẶC NEUTRAL PLACEHOLDER NẾU CHƯA CẬP NHẬT */}
                        {(item.imageUrl || item.thumbnail) && !(item.imageUrl || item.thumbnail || '').includes('unsplash.com') && !(item.imageUrl || item.thumbnail || '').includes('pexels.com') ? (
                          <Image
                            src={normalizeImagePath(item.imageUrl || item.thumbnail)}
                            alt={`${item.name} - Máy làm bánh công nghiệp cũ thanh lý tân trang Công Nguyên TP.HCM`}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-4 text-center select-none">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 text-slate-400">
                              <Wrench className="h-6 w-6 stroke-[1.5]" />
                            </div>
                            <span className="mt-2 text-xs font-semibold text-slate-400">Chưa cập nhật ảnh</span>
                          </div>
                        )}

                        {/* GRADIENT OVERLAY */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                        {/* HÀNG HUY HIỆU ĐỒNG BỘ: [ Tân Trang Đạt Chuẩn ] - [ Thương hiệu ] */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                          <span className="inline-flex items-center rounded-md bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-bold shadow-xs whitespace-nowrap">
                            Tân Trang Đạt Chuẩn
                          </span>

                          {item.brand && (
                            <span className="inline-flex items-center rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md shadow-xs border border-white/10 whitespace-nowrap truncate max-w-[130px]">
                              {typeof item.brand === 'object' ? item.brand.name : item.brand}
                            </span>
                          )}
                        </div>

                        {/* HUY HIỆU TIẾT KIỆM GÓC TRÁI DƯỚI BADGE */}
                        {hasDiscount && (
                          <div className="absolute top-8.5 left-2.5 z-10 pointer-events-none">
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow-xs border border-emerald-400/30 whitespace-nowrap">
                              Tiết kiệm {formatVND(savingsAmount)} (-{discountPercent}%)
                            </span>
                          </div>
                        )}

                        {/* NẾU ĐÃ BÁN */}
                        {isSold && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                            <span className="rounded-xl bg-red-600/90 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-xl border border-white/20">
                              ĐÃ BÁN
                            </span>
                          </div>
                        )}
                      </div>

                      {/* NỘI DUNG CARD */}
                      <div className="p-3.5 sm:p-4">
                        {/* DANH MỤC / PHÂN LOẠI */}
                        {item.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 rounded-md px-2 py-0.5 inline-block truncate max-w-full">
                            {item.category.name}
                          </span>
                        )}

                        {/* TÊN SẢN PHẨM */}
                        <h3 className="mt-1.5 text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition">
                          <Link href={`/products/${item.slug}`}>
                            {item.name}
                          </Link>
                        </h3>

                        {/* CẢNH BÁO TÍNH KHAN HIẾM */}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-900 bg-amber-50 rounded-lg px-2.5 py-1 font-semibold border border-amber-200/80">
                          <span className="truncate">{scarcityText}</span>
                        </div>

                        {/* KHỐI SO SÁNH GIÁ THÔNG MINH */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          {/* Thông số 1: Giá máy mới thị trường */}
                          {hasDiscount && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Giá máy mới thị trường:</span>
                              <span className="line-through font-semibold text-slate-400">
                                ~{formatVND(origPriceNum)}
                              </span>
                            </div>
                          )}

                          {/* Thông số 2: Giá hàng tân trang */}
                          <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
                            <span className="text-[11px] font-bold text-slate-700">Giá hàng tân trang:</span>
                            <span className="text-base sm:text-lg font-black text-rose-600">
                              {formatVND(basePriceNum)}
                            </span>
                          </div>

                          {/* Thông số 3: Huy hiệu Tiết kiệm */}
                          {hasDiscount && (
                            <div className="mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800 border border-emerald-200">
                              <span>TIẾT KIỆM:</span>
                              <span className="text-emerald-700">
                                {formatVND(savingsAmount)} (-{discountPercent}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CỤM NÚT HÀNH ĐỘNG KÉP (DUAL CTA BUTTONS) */}
                    <div className="p-3.5 sm:p-4 pt-0 space-y-2">
                      {isSold ? (
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-xl bg-slate-200 px-3 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed text-center"
                        >
                          Sản phẩm đã bán
                        </button>
                      ) : (
                        <>
                          {/* Nút 1: Nhận Báo Giá / Giữ Máy (RFQ) */}
                          <Link
                            href={`/products/${item.slug}#rfq-section`}
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs py-2.5 px-3 shadow-md shadow-amber-500/25 transition-all duration-200 group/btn"
                          >
                            <span>Nhận Báo Giá / Giữ Máy (RFQ)</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>

                          {/* Nút 2: Hotline / Zalo: 0976 619 044 */}
                          <a
                            href="https://zalo.me/0976619044"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/60 active:scale-95 text-slate-800 hover:text-amber-900 font-bold text-[11px] py-1.5 px-3 transition"
                            title="Chat Zalo thương lượng hoặc xem video test máy"
                          >
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Hotline / Zalo: <strong>0976 619 044</strong></span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER SECTION: CAM KẾT THANH LÝ AN TÂM */}
        <div className="mt-10 rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Kiểm định chất lượng 100%</p>
              <p className="text-[11px] text-slate-500">Mọi đồ dùng & sách được kiểm tra kỹ trước khi giao</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Bảo vệ người mua & Đổi trả</p>
              <p className="text-[11px] text-slate-500">Hỗ trợ đối soát và kiểm tra hàng trước khi nhận</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Ship hỏa tốc trong ngày</p>
              <p className="text-[11px] text-slate-500">Giao nhanh nội thành, kịp thời cho kỳ học mới</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
