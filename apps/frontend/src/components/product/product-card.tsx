'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatVND, normalizeImagePath } from '@/lib/utils';
import { Zap, ShieldCheck, FileText, ShoppingCart, ArrowRight, Bell, Wrench } from 'lucide-react';
import { PowerType } from '@industrial-bakery/shared-types';
import { useCart } from '@/context/cart-context';

export interface ProductVariantItem {
  id: string;
  sku: string;
  name: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  powerType: PowerType;
  powerKw?: number | string | null;
  weightKg?: number | string | null;
  stockQuantity: number;
  isQuoteOnly: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  modelCode?: string | null;
  summary?: string | null;
  description?: string | null;
  refurbishDetails?: string | null;
  isQuoteOnly: boolean;
  condition?: string | null;
  availability?: string | null;
  stock?: number;
  soldCount?: number;
  status?: string;
  originalPrice?: number | string | null;
  basePrice?: number | string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  thumbnail?: string | null;
  avatar?: string | null;
  imageUrl?: string | null;
  images?: any;
  specSheetPdfUrl?: string | null;
  warrantyMonths: number;
  note?: string;
  brand?: {
    name: string;
    slug: string;
    originCountry?: string | null;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  variants: ProductVariantItem[];
}

interface ProductCardProps {
  product: ProductListItem;
  onOpenRfq?: (product: ProductListItem) => void;
}

function getConditionDisplay(cond?: string | null, details?: string | null) {
  if (cond === 'LIKE_NEW_99') {
    return { text: 'Mới 100%', bg: 'bg-emerald-600 text-white font-bold' };
  }
  if (cond === 'EXCELLENT_90_95') {
    return { text: 'Độ Mới 90-95%', bg: 'bg-blue-600 text-white font-bold' };
  }
  if (cond === 'FAIR_80') {
    return { text: 'Thanh Lý 80%', bg: 'bg-slate-800 text-white font-bold' };
  }
  // Mặc định chuẩn hoá theo yêu cầu: [ Tân Trang Đạt Chuẩn ]
  return { text: 'Tân Trang Đạt Chuẩn', bg: 'bg-amber-500 text-slate-950 font-bold' };
}

export function ProductCard({ product, onOpenRfq }: ProductCardProps) {
  const primaryVariant = product.variants?.[0];
  const has380V = product.variants?.some(
    (v) => v.powerType === PowerType.THREE_PHASE_380V,
  );
  const has220V = product.variants?.some(
    (v) => v.powerType === PowerType.SINGLE_PHASE_220V,
  );

  const condBadge = getConditionDisplay(product.condition, product.refurbishDetails);

  const priceNum =
    typeof primaryVariant?.price === 'number'
      ? primaryVariant.price
      : typeof product.basePrice === 'number'
      ? product.basePrice
      : Number(primaryVariant?.price || product.basePrice || 0);

  const origPriceNum =
    typeof product.originalPrice === 'number'
      ? product.originalPrice
      : Number(product.originalPrice || 0);

  const savingsAmount =
    origPriceNum > priceNum && priceNum > 0 ? origPriceNum - priceNum : 0;
  const savingsPercent =
    origPriceNum > 0 && savingsAmount > 0
      ? Math.round((savingsAmount / origPriceNum) * 100)
      : 0;

  // Tính tồn kho thực tế & trạng thái hết hàng
  const stock =
    product.stock !== undefined
      ? Number(product.stock)
      : product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 1;

  const isOutOfStock =
    stock <= 0 ||
    product.status === 'out_of_stock' ||
    product.availability === 'SOLD';

  const scarcityText = isOutOfStock
    ? '🔴 Đã bán hết (0 máy tại kho)'
    : product.note ||
      (stock <= 3
        ? `⚡ Còn lại: ${stock} máy kho Đông Hưng Thuận`
        : `⚡ Còn lại: ${stock} máy tại kho`);

  const [imageError, setImageError] = useState(false);

  // Chỉ lấy ảnh thật do người dùng tải lên, loại bỏ hoàn toàn các link demo cũ
  const isDemoUrl = (url?: string | null) => {
    if (!url) return false;
    return url.includes('images.unsplash.com') || url.includes('images.pexels.com');
  };

  const firstImage = Array.isArray(product.images) && product.images.length > 0
    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
    : null;

  const rawImage =
    (product.imageUrl && product.imageUrl.trim()) ||
    (product.thumbnail && product.thumbnail.trim()) ||
    (product.avatar && product.avatar.trim()) ||
    (firstImage && firstImage.trim()) ||
    null;

  const validImage = rawImage && !isDemoUrl(rawImage) && !imageError ? normalizeImagePath(rawImage) : null;

  const handleRfqClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onOpenRfq) {
      onOpenRfq(product);
    } else {
      window.location.href = `/products/${product.slug}#rfq-section`;
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOutOfStock
          ? 'border-slate-300 bg-slate-50/90 opacity-90'
          : 'border-slate-200/90 bg-white hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl'
      }`}
    >
      {/* 1. KHỐI HÌNH ẢNH & BADGES */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          {validImage ? (
            <Image
              src={validImage}
              alt={`Thiết bị làm bánh - ${product.name}`}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                isOutOfStock ? 'grayscale opacity-80' : ''
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-4 text-center select-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/80 text-slate-400">
                <Wrench className="h-6 w-6 stroke-[1.5]" />
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-400">Chưa cập nhật ảnh</span>
            </div>
          )}
        </Link>

        {/* Lớp phủ & Huy hiệu ĐÃ BÁN / HẾT HÀNG nếu hết hàng */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-3">
            <span className="rounded-xl border-2 border-white/40 bg-red-600 px-3.5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-2xl">
              ĐÃ BÁN / TẠM HẾT HÀNG
            </span>
            <span className="mt-1 text-[10px] font-bold text-slate-200">
              Nhận tư vấn máy đợt tới
            </span>
          </div>
        )}

        {/* HÀNG HUY HIỆU ĐỒNG BỘ: [ Tân Trang Đạt Chuẩn ] - [ Ruyshing (Đài Loan) ] */}
        <div className="absolute left-2.5 top-2.5 right-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs whitespace-nowrap ${condBadge.bg}`}>
            {condBadge.text}
          </span>

          {product.brand && (
            <span className="inline-flex items-center rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md shadow-xs border border-white/10 whitespace-nowrap truncate max-w-[130px]">
              {product.brand.name}
            </span>
          )}
        </div>

        {/* HUY HIỆU TIẾT KIỆM GÓC TRÁI DƯỚI BADGE */}
        {savingsAmount > 0 && (
          <div className="absolute left-2.5 top-8.5 z-10 pointer-events-none">
            <span className="inline-flex items-center rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white shadow-xs border border-emerald-400/30 whitespace-nowrap">
              Tiết kiệm {formatVND(savingsAmount)} (-{savingsPercent}%)
            </span>
          </div>
        )}

        {/* Nguồn điện góc dưới */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1">
          {has380V && (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-slate-950 shadow-xs">
              380V (3 Pha)
            </span>
          )}
          {product.modelCode && (
            <span className="hidden sm:inline-block rounded-md border border-slate-300/40 bg-white/90 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 shadow-xs">
              {product.modelCode}
            </span>
          )}
        </div>
      </div>

      {/* 2. KHỐI NỘI DUNG SẢN PHẨM */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-5">
        <div>
          {/* Danh mục */}
          {product.category && (
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 block truncate">
              {product.category.name}
            </span>
          )}

          {/* Tên thiết bị */}
          <h3 className="mt-1 text-xs sm:text-base font-bold text-slate-900 transition-colors group-hover:text-amber-600 line-clamp-2 leading-snug">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Tóm tắt mô tả */}
          {product.summary && (
            <p className="mt-1.5 hidden text-xs leading-relaxed text-slate-500 line-clamp-2 sm:block">
              {product.summary}
            </p>
          )}

          {/* HUY HIỆU TÌNH TRẠNG & KHAN HIẾM (URGENCY & SCARCITY BADGE) */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-900 bg-amber-50 rounded-lg px-2.5 py-1 font-semibold border border-amber-200/80">
            <span className="truncate">{scarcityText}</span>
          </div>
        </div>

        {/* 3. KHỐI SO SÁNH GIÁ THÔNG MINH (PRICE COMPARISON & SAVINGS WIDGET) */}
        <div className="mt-3 sm:mt-4 border-t border-slate-100 pt-2.5 sm:pt-3.5">
          {/* Thông số 1: Giá máy mới thị trường */}
          {origPriceNum > 0 && (
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
              <span>Giá máy mới thị trường:</span>
              <span className="line-through font-semibold text-slate-400">
                ~{formatVND(origPriceNum)}
              </span>
            </div>
          )}

          {/* Thông số 2: Giá hàng tân trang */}
          <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700">
              Giá hàng tân trang:
            </span>
            <div className="flex items-baseline gap-1.5">
              {priceNum > 0 ? (
                <span className="text-base sm:text-xl font-black text-rose-600">
                  {formatVND(priceNum)}
                </span>
              ) : (
                <span className="text-sm sm:text-base font-black text-rose-600">
                  Liên hệ giá xưởng
                </span>
              )}
            </div>
          </div>

          {/* Thông số 3: Huy hiệu Tiết kiệm (Savings Badge) */}
          {savingsAmount > 0 && (
            <div className="mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1 text-[10px] sm:text-xs font-black text-emerald-800 border border-emerald-200">
              <span>TIẾT KIỆM:</span>
              <span className="text-emerald-700">
                {formatVND(savingsAmount)} (-{savingsPercent}%)
              </span>
            </div>
          )}

          {/* 4. CỤM NÚT KÊU GỌI HÀNH ĐỘNG KÉP (DUAL CTA BUTTONS) */}
          <div className="mt-3.5 grid grid-cols-1 gap-2">
            {isOutOfStock ? (
              <>
                {/* Nút bị vô hiệu hóa khi hết hàng */}
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-200/90 px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-500 cursor-not-allowed opacity-80"
                >
                  <span>Đã Bán / Tạm Hết Hàng</span>
                </button>

                {/* Nút thay thế: Tư vấn máy tương đương / Báo giá khi có hàng */}
                <a
                  href={`https://zalo.me/0976619044?text=${encodeURIComponent(`Chào Công Nguyên, tôi quan tâm máy đã bán "${product.name}". Xin tư vấn máy tương đương hoặc báo giá khi có hàng đợt tới!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/25 transition cursor-pointer"
                  title="Nhận báo giá khi có hàng hoặc tư vấn máy tương đương"
                >
                  <Bell className="h-4 w-4" />
                  <span>Tư Vấn Máy Tương Đương</span>
                </a>

                {/* Hotline kết nối nhanh */}
                <a
                  href="tel:0976619044"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-700 transition"
                >
                  <span>Hotline Kỹ Thuật: <strong>0976 619 044</strong></span>
                </a>
              </>
            ) : (
              <>
                {/* Nút 1 (Chính - Nổi bật nhất): Nhận Báo Giá / Giữ Máy (RFQ) */}
                <button
                  type="button"
                  onClick={handleRfqClick}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 px-3 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/25 transition cursor-pointer"
                >
                  <span>Nhận Báo Giá / Giữ Máy (RFQ)</span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0" />
                </button>

                {/* Nút 2 (Phụ - Kết nối nhanh): Hotline / Zalo: 0976 619 044 */}
                <a
                  href="https://zalo.me/0976619044"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/60 active:scale-98 px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-800 hover:text-amber-900 transition"
                  title="Chat Zalo thương lượng hoặc xem video test máy"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hotline / Zalo: <strong>0976 619 044</strong></span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
