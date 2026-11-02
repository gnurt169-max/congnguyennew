'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeImagePath } from '@/lib/utils';
import { ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Pause, Play, Wrench, Layers, Check } from 'lucide-react';

export interface HomepageHeroConfig {
  badgeText?: string;
  headingText?: string;
  headingHighlight?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  stats?: Array<{ value: string; label: string }>;
  featuredImageUrl?: string;
  featuredBadgeTag?: string;
  featuredCategoryTag?: string;
  featuredTitle?: string;
  featuredStatusTag?: string;
  founderShow?: boolean;
  founderName?: string;
  founderTitle?: string;
  founderCommitment?: string;
  founderAvatarUrl?: string;
  founderLine?: string;
}

const DEFAULT_CONFIG: Required<HomepageHeroConfig> = {
  badgeText: 'CHUYÊN GIA THIẾT BỊ BÁNH TÂN TRANG',
  headingText: 'Kho Máy Làm Bánh Công Nghiệp & Máy Làm Bánh Cũ Tân Trang.',
  headingHighlight: 'Chuẩn Kỹ Thuật Tại TP.HCM.',
  description:
    'Công Nguyên chuyên mua bán, tân trang và thanh lý máy làm bánh công nghiệp, máy làm bánh cũ giá tốt tại TP.HCM: lò nướng bánh, máy trộn bột, tủ trưng bày bánh kem... Bảo hành kỹ thuật tận nơi, hỗ trợ chạy thử trực tiếp tại xưởng.',
  primaryCtaText: 'Xem Kho Máy Tân Trang',
  primaryCtaLink: '/products',
  secondaryCtaText: 'Báo Giá Thu Mua Máy Cũ',
  secondaryCtaLink: '/thanh-ly',
  stats: [
    { value: '-50%', label: 'Chi phí so với mua mới' },
    { value: '06 Tháng', label: 'Bảo hành kỹ thuật tận nơi' },
    { value: 'Test Tại Xưởng', label: '6/3 DN4 Đông Hưng Thuận' },
  ],
  featuredImageUrl: '/uploads/products/lo-nuong-southstar.webp',
  featuredBadgeTag: 'Đã kiểm định kỹ thuật • Độ mới 90-95%',
  featuredCategoryTag: 'TIÊU BIỂU XUẤT XƯỞNG',
  featuredTitle: 'Lò Nướng Đối Lưu & Tủ Bánh Kem Ruyshing',
  featuredStatusTag: 'Sẵn sàng chạy thử',
  founderShow: true,
  founderName: 'Vương Công Nguyên',
  founderTitle: 'Chủ Xưởng Kỹ Thuật',
  founderCommitment: 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng',
  founderAvatarUrl: '/uploads/products/congnguyen-1793445417987-nqrgf.webp',
  founderLine: 'Vương Công Nguyên – Trực tiếp kiểm định từng máy & bàn giao tận xưởng',
};

export interface SectionVisibilityConfig {
  showBadge?: boolean;
  showHeroStats?: boolean;
  showHeroFeaturedCard?: boolean;
  showSecondaryCTA?: boolean;
  showFloatingContact?: boolean;
  showWorkshopLocation?: boolean;
  showHotProductsSection?: boolean;
  showTestimonials?: boolean;
}

export interface HeroProductItem {
  id: string;
  title: string;
  categoryTag: string;
  imageUrl: string;
  badgeTag: string;
  statusTag: string;
  link: string;
  priceFormatted?: string;
  originalPriceFormatted?: string;
  discountPercent?: number;
}

interface HeroSectionProps {
  config?: HomepageHeroConfig | null;
  products?: any[] | null;
  visibility?: SectionVisibilityConfig | null;
}

export function HeroSection({ config, products, visibility }: HeroSectionProps) {
  const badgeText = config?.badgeText !== undefined && config?.badgeText !== null ? config.badgeText : DEFAULT_CONFIG.badgeText;
  const headingText = config?.headingText !== undefined && config?.headingText !== null ? config.headingText : DEFAULT_CONFIG.headingText;
  const headingHighlight = config?.headingHighlight !== undefined && config?.headingHighlight !== null ? config.headingHighlight : DEFAULT_CONFIG.headingHighlight;
  const description = config?.description !== undefined && config?.description !== null ? config.description : DEFAULT_CONFIG.description;
  const primaryCtaText = config?.primaryCtaText !== undefined && config?.primaryCtaText !== null ? config.primaryCtaText : DEFAULT_CONFIG.primaryCtaText;
  const primaryCtaLink = config?.primaryCtaLink !== undefined && config?.primaryCtaLink !== null ? config.primaryCtaLink : DEFAULT_CONFIG.primaryCtaLink;
  const secondaryCtaText = config?.secondaryCtaText !== undefined && config?.secondaryCtaText !== null ? config.secondaryCtaText : DEFAULT_CONFIG.secondaryCtaText;
  const secondaryCtaLink = config?.secondaryCtaLink !== undefined && config?.secondaryCtaLink !== null ? config.secondaryCtaLink : DEFAULT_CONFIG.secondaryCtaLink;
  const stats = Array.isArray(config?.stats) && config.stats.length > 0 ? config.stats : DEFAULT_CONFIG.stats;

  // Cấu hình Kỹ sư sáng lập / Chủ doanh nghiệp
  const founderShow = config?.founderShow !== undefined && config?.founderShow !== null ? Boolean(config.founderShow) : DEFAULT_CONFIG.founderShow;
  const founderName = config?.founderName || DEFAULT_CONFIG.founderName;
  const founderTitle = config?.founderTitle || DEFAULT_CONFIG.founderTitle;
  const founderCommitment = config?.founderCommitment || DEFAULT_CONFIG.founderCommitment;
  const founderAvatarUrl = config?.founderAvatarUrl || DEFAULT_CONFIG.founderAvatarUrl;
  const founderLineText = config?.founderLine?.trim() || `${founderName} – ${founderCommitment || founderTitle || 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng'}`;

  // Phân giải thông tin cho Founder Trust Card (Tên, Tag, Cam kết chuyên môn)
  const { displayFounderName, displayFounderTag, displayFounderCommitment } = useMemo(() => {
    let name = founderName?.trim() || 'Vương Công Nguyên';
    let commitment = founderCommitment?.trim() || 'Trực tiếp kiểm định từng máy & bàn giao tận xưởng';
    let tag = founderTitle?.trim() || 'Chủ Xưởng Kỹ Thuật';

    if (founderLineText) {
      if (founderLineText.includes('–')) {
        const parts = founderLineText.split('–');
        const extractedName = parts[0].trim();
        const extractedCommitment = parts.slice(1).join('–').trim();
        if (extractedName) name = extractedName;
        if (extractedCommitment) commitment = extractedCommitment;
      } else if (founderLineText.includes(' - ')) {
        const parts = founderLineText.split(' - ');
        const extractedName = parts[0].trim();
        const extractedCommitment = parts.slice(1).join(' - ').trim();
        if (extractedName) name = extractedName;
        if (extractedCommitment) commitment = extractedCommitment;
      }
    }

    if (!tag || tag.includes('Đại diện Xưởng') || tag.length > 25) {
      tag = 'Chủ Xưởng Kỹ Thuật';
    }

    return {
      displayFounderName: name,
      displayFounderTag: tag,
      displayFounderCommitment: commitment,
    };
  }, [founderName, founderTitle, founderCommitment, founderLineText]);

  // Helper kiểm tra URL ảnh có phải mock Unsplash/Pexels hoặc rỗng không
  const isMockOrEmptyUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string') return true;
    const trimmed = url.trim();
    if (!trimmed) return true;
    return trimmed.includes('unsplash.com') || trimmed.includes('pexels.com');
  };

  // Chuẩn bị danh sách sản phẩm hiển thị trên Carousel Card (Chỉ chọn máy còn hàng stock > 0)
  const carouselItems: HeroProductItem[] = useMemo(() => {
    if (Array.isArray(products) && products.length > 0) {
      const inStockList = products.filter((prod) => {
        const curStock = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 1;
        const isSoldOut = curStock <= 0 || prod.status === 'out_of_stock' || prod.availability === 'SOLD';
        return !isSoldOut;
      });

      const listToDisplay = inStockList.length > 0 ? inStockList : products;

      return listToDisplay.map((prod) => {
        const orig = Number(prod.originalPrice || 0);
        const base = Number(prod.basePrice || prod.minPrice || 0);
        let discount = 0;
        if (orig > 0 && base > 0 && orig > base) {
          discount = Math.round(((orig - base) / orig) * 100);
        }

        const badgeTag = discount > 0
          ? `GIẢM ${discount}% • Đã kiểm định`
          : 'Đã kiểm định kỹ thuật • Độ mới 90-95%';

        return {
          id: prod.id,
          title: prod.name,
          categoryTag: prod.category?.name || 'MÁY LÀM BÁNH TÂN TRANG',
          imageUrl: normalizeImagePath(prod.imageUrl || prod.thumbnail || prod.images?.[0] || DEFAULT_CONFIG.featuredImageUrl),
          badgeTag: badgeTag,
          statusTag: 'Sẵn sàng bàn giao',
          link: `/products/${prod.slug}`,
          priceFormatted: base > 0 ? `${base.toLocaleString('vi-VN')}₫` : undefined,
          originalPriceFormatted: orig > 0 && orig > base ? `${orig.toLocaleString('vi-VN')}₫` : undefined,
          discountPercent: discount,
        };
      });
    }

    // Dữ liệu dự phòng nếu chưa có sản phẩm từ API
    return [
      {
        id: 'default',
        title: config?.featuredTitle || DEFAULT_CONFIG.featuredTitle,
        categoryTag: config?.featuredCategoryTag || DEFAULT_CONFIG.featuredCategoryTag,
        imageUrl: normalizeImagePath(config?.featuredImageUrl || DEFAULT_CONFIG.featuredImageUrl),
        badgeTag: config?.featuredBadgeTag || DEFAULT_CONFIG.featuredBadgeTag,
        statusTag: config?.featuredStatusTag || DEFAULT_CONFIG.featuredStatusTag,
        link: '/products',
      },
    ];
  }, [products, config]);

  // Quản lý trạng thái chuyển đổi tự động mỗi 3 giây (3000ms)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    if (carouselItems.length <= 1) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
      setIsFading(false);
    }, 250);
  }, [carouselItems.length]);

  useEffect(() => {
    if (isPaused || carouselItems.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, carouselItems.length, nextSlide]);

  const currentItem = carouselItems[currentIndex] || carouselItems[0];

  return (
    <section className="relative overflow-hidden bg-slate-900 py-16 lg:py-24 text-white">
      {/* NỀN HỌA TIẾT & HIỆU ỨNG ÁNH SÁNG */}
      <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ========================================================= */}
          {/* CỘT TRÁI (7 PHẦN) - TIÊU ĐỀ, MÔ TẢ & 3 STATS */}
          {/* ========================================================= */}
          <div className="lg:col-span-7">
            {/* BADGE NHỎ PHÍA TRÊN */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold tracking-wider uppercase text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{badgeText}</span>
            </div>

            {/* TIÊU ĐỀ CHÍNH H1 */}
            <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {headingText}{' '}
              {headingHighlight && (
                <>
                  <br className="hidden sm:inline" />
                  <span className="text-amber-500">{headingHighlight}</span>
                </>
              )}
            </h1>

            {/* ĐOẠN MÔ TẢ ĐÚNG TRỌNG TÂM */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {description}
            </p>

            {/* HAI NÚT BẤM CTA */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={primaryCtaLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryCtaLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-transparent px-6 py-3.5 text-sm sm:text-base font-bold text-slate-200 transition-all hover:bg-slate-800/80 hover:text-white hover:border-slate-500 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{secondaryCtaText}</span>
              </Link>
            </div>

            {/* DẢI CAM KẾT XƯỞNG THỰC TẾ (STAT STRIP) */}
            <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-3 sm:gap-6">
              {stats.map((s, idx) => (
                <div
                  key={idx}
                  className={idx > 0 ? 'border-l border-slate-800/80 pl-3 sm:pl-6' : ''}
                >
                  <div className="text-xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-slate-400 leading-snug">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* CỘT PHẢI (5 PHẦN) - AUTO-ROTATE PRODUCT CARD + FOUNDER FRAME */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 relative">
            {/* CONTAINER CHÍNH CỐ ĐỊNH KÍCH THƯỚC TRÁNH CLS */}
            <div
              className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-2xl backdrop-blur-xl group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* HIỆU ỨNG GLOW AMBER */}
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-amber-500/25 via-transparent to-blue-500/15 blur-xl opacity-70 pointer-events-none group-hover:opacity-100 transition-opacity duration-500" />

              {/* CARD SẢN PHẨM XOAY VÒNG (CLICKABLE LINK) */}
              <Link
                href={currentItem.link}
                className="block relative overflow-hidden rounded-2xl bg-slate-950 aspect-[4/3] sm:aspect-[16/11] select-none"
              >
                {/* ẢNH MÁY HOẶC PLACEHOLDER CƠ KHÍ KỸ THUẬT XƯỞNG */}
                <div
                  className={`relative w-full h-full transition-all duration-300 ease-out ${
                    isFading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  {!isMockOrEmptyUrl(currentItem.imageUrl) ? (
                    <>
                      <Image
                        src={currentItem.imageUrl}
                        alt={`${currentItem.title} - Máy làm bánh công nghiệp thanh lý & tân trang chuẩn kỹ thuật tại TP.HCM`}
                        fill
                        priority={true}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-center select-none overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#d97706_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-15" />
                      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10 mb-3 group-hover:scale-105 transition-transform duration-300">
                        <Wrench className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse text-amber-400" />
                      </div>

                      <div className="relative z-10 max-w-[280px]">
                        <span className="inline-block rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-amber-300 uppercase mb-1.5">
                          MÁY CHUẨN KỸ THUẬT CÔNG NGUYÊN
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-snug">
                          Ảnh thực tế tại xưởng đang cập nhật
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Hỗ trợ test máy chạy thử trực tiếp tại xưởng TP.HCM
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* TAG NỔI GÓC TRÊN TRÁI: KIỂM ĐỊNH HOẶC GIẢM GIÁ */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/85 backdrop-blur-md px-3 py-1 text-xs font-semibold text-slate-100 shadow-xl transition-all duration-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="truncate max-w-[210px] sm:max-w-none">{currentItem.badgeTag}</span>
                </div>

                {/* CHỈ BÁO TIẾN ĐỘ 3 GIÂY & NÚT TRẠNG THÁI (GÓC TRÊN PHẢI) */}
                {carouselItems.length > 1 && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/75 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300 shadow-md">
                    {isPaused ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Pause className="h-3 w-3" />
                        <span>Dừng</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>3s</span>
                      </span>
                    )}
                    <span className="text-slate-500">|</span>
                    <span>{currentIndex + 1}/{carouselItems.length}</span>
                  </div>
                )}

                {/* KHỐI THÔNG TIN SẢN PHẨM (GÓC DƯỚI) - CỐ ĐỊNH CHIỀU CAO CHỐNG CLS */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-end justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-widest truncate">
                      {currentItem.categoryTag}
                    </p>
                    <p className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 mt-0.5">
                      {currentItem.title}
                    </p>
                    {currentItem.priceFormatted && (
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-extrabold text-amber-400 text-sm sm:text-base">
                          {currentItem.priceFormatted}
                        </span>
                        {currentItem.originalPriceFormatted && (
                          <span className="line-through text-slate-400 text-[11px]">
                            {currentItem.originalPriceFormatted}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* NHÃN TRẠNG THÁI BÀN GIAO */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 backdrop-blur px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-300 border border-emerald-500/40 shadow-sm">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{currentItem.statusTag}</span>
                    </span>
                  </div>
                </div>
              </Link>

              {/* DẢI DOTS CHUYỂN SLIDE BÊN DƯỚI CARD */}
              {carouselItems.length > 1 && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  {carouselItems.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Chuyển tới máy ${item.title}`}
                      onClick={() => {
                        setIsFading(true);
                        setTimeout(() => {
                          setCurrentIndex(idx);
                          setIsFading(false);
                        }, 200);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentIndex === idx
                          ? 'w-6 bg-amber-400'
                          : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* FOUNDER TRUST CARD - KHUNG THÔNG TIN CHỦ XƯỞNG CAO CẤP */}
            {/* ========================================================= */}
            {founderShow && (
              <div className="mt-4 w-full rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-md ring-1 ring-white/10 hover:border-amber-500/50 transition-all duration-300 flex items-center gap-3.5 sm:gap-4">
                {/* AVATAR CHỦ XƯỞNG (56px MOBILE, 64px DESKTOP - SQUIRCLE VIỀN SÁNG KỸ THUẬT & TÍCH XANH KIỂM ĐỊNH) */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-amber-500/90 shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/10 bg-slate-800 flex items-center justify-center">
                    {founderAvatarUrl && !founderAvatarUrl.includes('unsplash.com') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={founderAvatarUrl}
                        alt={displayFounderName}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl sm:text-2xl">
                        {displayFounderName ? displayFounderName.trim().charAt(0) : 'C'}
                      </div>
                    )}
                  </div>
                  {/* HUY HIỆU TÍCH XANH KIỂM ĐỊNH TẠI XƯỞNG */}
                  <span
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-slate-900 shadow-sm"
                    title="Kỹ sư trực tiếp kiểm định tại xưởng"
                  >
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3.5]" />
                  </span>
                </div>

                {/* NỘI DUNG FOUNDER TRUST CARD - PHÂN CẤP RÕ RÀNG & KHÔNG TRUNCATE */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-amber-400 tracking-wide uppercase">
                      {displayFounderName}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-amber-300">
                      {displayFounderTag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-snug font-medium">
                    {displayFounderCommitment}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-emerald-400 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Đang trực tiếp tại xưởng TP.HCM</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
