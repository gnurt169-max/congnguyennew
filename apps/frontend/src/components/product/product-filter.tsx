'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  SlidersHorizontal,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { PowerType } from '@industrial-bakery/shared-types';

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export interface FilterBrand {
  id: string;
  name: string;
  slug: string;
  originCountry?: string | null;
  _count?: { products: number };
}

interface ProductFilterProps {
  categories: FilterCategory[];
  brands: FilterBrand[];
}

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 10.000.000 đ (Phụ kiện/Khay)', min: 0, max: 10000000 },
  { label: '10.000.000 đ – 50.000.000 đ', min: 10000000, max: 50000000 },
  { label: '50.000.000 đ – 100.000.000 đ', min: 50000000, max: 100000000 },
  { label: 'Trên 100.000.000 đ (Lò xoay/Dây chuyền)', min: 100000000, max: undefined },
];

const CONDITION_OPTIONS = [
  { value: '', label: 'Tất cả độ mới' },
  { value: 'LIKE_NEW_99', label: 'Like New 99% (Trưng bày)' },
  { value: 'EXCELLENT_90_95', label: 'Đẹp 90-95% (Nguyên bản)' },
  { value: 'REFURBISHED_FULL', label: 'Tân Trang Toàn Diện' },
  { value: 'FAIR_80', label: 'Hoạt động tốt 80%' },
];

export function ProductFilter({ categories, brands }: ProductFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Đọc giá trị hiện tại từ URL Search Params (hỗ trợ cả category, categorySlug, power, powerSource, powerType)
  const currentCategory = searchParams.get('category') || searchParams.get('categorySlug') || searchParams.get('cat') || '';
  const currentBrand = searchParams.get('brand') || searchParams.get('brandSlug') || '';
  const currentPowerType = searchParams.get('power') || searchParams.get('powerSource') || searchParams.get('powerType') || '';
  const currentIsQuoteOnly = searchParams.get('isQuoteOnly');
  const currentMinPrice = searchParams.get('minPrice');
  const currentMaxPrice = searchParams.get('maxPrice');
  const currentCondition = searchParams.get('condition') || '';

  // Chỉ hiển thị các danh mục đang có sản phẩm thực tế (productCount > 0), tự động ẩn danh mục rỗng
  const activeCategories = categories.filter((cat) => (cat._count?.products ?? 0) > 0);

  // Bottom Sheet Mobile Filter State
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Khóa scroll khi mở Bottom Sheet
  useEffect(() => {
    if (isMobileSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSheetOpen]);

  // Trạng thái thu gọn/mở rộng từng nhóm bộ lọc desktop
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    condition: true,
    brand: true,
    power: true,
    flow: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Hàm cập nhật URL Params đồng bộ
  const updateQueryParam = useCallback(
    (paramsToUpdate: Record<string, string | null | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(paramsToUpdate).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào
      current.delete('page');

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Hàm cuộn mượt lên vị trí đầu danh sách sản phẩm (trừ 80px để không bị Header che khuất)
  const scrollToProductGrid = useCallback(() => {
    if (typeof window === 'undefined') return;
    const section = document.getElementById('product-grid-section');
    if (section) {
      const yOffset = -80;
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  // Cuộn mượt khi searchParams thay đổi (khi người dùng thao tác bộ lọc)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      scrollToProductGrid();
    }, 60);
    return () => clearTimeout(timer);
  }, [searchParams, scrollToProductGrid]);

  // Xóa toàn bộ bộ lọc
  const handleResetFilters = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    router.push(pathname, { scroll: false });
    setIsMobileSheetOpen(false);
    document.body.style.overflow = '';
    setTimeout(() => {
      scrollToProductGrid();
    }, 100);
  };

  // Đóng Drawer và cuộn ngay lên danh sách kết quả trên Mobile
  const handleApplyMobileFilters = () => {
    setIsMobileSheetOpen(false);
    document.body.style.overflow = '';
    setTimeout(() => {
      scrollToProductGrid();
    }, 100);
  };

  const handleSelectCategoryMobile = (slug: string) => {
    handleSelectCategory(slug);
    setIsMobileSheetOpen(false);
    document.body.style.overflow = '';
    setTimeout(() => {
      scrollToProductGrid();
    }, 100);
  };

  const handleSelectCategory = (slug: string) => {
    const isSelected = currentCategory === slug;
    updateQueryParam({
      category: isSelected ? '' : slug,
      categorySlug: isSelected ? '' : slug,
    });
  };

  const handleSelectPower = (pType: string) => {
    const is380 = pType === PowerType.THREE_PHASE_380V || pType === '380V';
    const is220 = pType === PowerType.SINGLE_PHASE_220V || pType === '220V';
    const isSelected =
      (is380 && (currentPowerType === '380V' || currentPowerType === PowerType.THREE_PHASE_380V)) ||
      (is220 && (currentPowerType === '220V' || currentPowerType === PowerType.SINGLE_PHASE_220V));

    updateQueryParam({
      power: isSelected ? '' : is380 ? '380V' : '220V',
      powerSource: isSelected ? '' : is380 ? '380V' : '220V',
      powerType: isSelected ? '' : is380 ? PowerType.THREE_PHASE_380V : PowerType.SINGLE_PHASE_220V,
    });
  };

  const handleSelectCondition = (cond: string) => {
    const isSelected = currentCondition === cond;
    updateQueryParam({
      condition: isSelected ? '' : cond,
    });
  };

  const handleSelectBrand = (brandSlug: string) => {
    const isSelected = currentBrand === brandSlug;
    updateQueryParam({
      brand: isSelected ? '' : brandSlug,
      brandSlug: isSelected ? '' : brandSlug,
    });
  };

  // Đếm số lượng bộ lọc đang active
  const activeFiltersCount = [
    currentCategory,
    currentBrand,
    currentPowerType,
    currentIsQuoteOnly,
    currentMinPrice,
    currentCondition,
  ].filter(Boolean).length;

  return (
    <>
      {/* ======================================================== */}
      {/* 1. THANH CUỘN NGANG DANH MỤC & NÚT BỘ LỌC CHO MOBILE (< LG) */}
      {/* ======================================================== */}
      <div className="lg:hidden w-full mb-4 space-y-2.5">
        {/* Nút kích hoạt Bottom Sheet bộ lọc kỹ thuật */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSheetOpen(true)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
              activeFiltersCount > 0
                ? 'bg-amber-500 text-slate-950 border border-amber-600 font-black'
                : 'bg-white text-slate-800 border border-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Bộ lọc kỹ thuật</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Thanh cuộn ngang chứa Pill Tags danh mục nhanh */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => handleSelectCategory('')}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              !currentCategory
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất cả máy
          </button>

          {activeCategories.map((cat) => {
            const count = cat._count?.products ?? 0;
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={`mobile-pill-${cat.id}`}
                type="button"
                onClick={() => handleSelectCategory(cat.slug)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BOTTOM SHEET TRƯỢT TỪ DƯỚI LÊN CHO MOBILE (< LG) */}
      {/* ======================================================== */}
      {isMobileSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop tối mờ */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileSheetOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white shadow-2xl flex flex-col z-50 animate-slide-up">
            {/* Grab Handle */}
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-slate-300" />

            {/* Header Sheet */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">Bộ Lọc Thông Số Kỹ Thuật</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* DANH MỤC THIẾT BỊ (CHỈ HIỂN THỊ CÁC DANH MỤC CÓ HÀNG THỰC TẾ) */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Danh mục thiết bị ({activeCategories.length})
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectCategoryMobile('')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                      !currentCategory
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <span>Tất cả danh mục</span>
                    {!currentCategory && <Check className="h-4 w-4 text-amber-600" />}
                  </button>
                  {activeCategories.map((cat) => {
                    const count = cat._count?.products ?? 0;
                    const isSelected = currentCategory === cat.slug;
                    return (
                      <button
                        key={`mob-sheet-cat-${cat.id}`}
                        type="button"
                        onClick={() => handleSelectCategoryMobile(cat.slug)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950'
                            : 'border-slate-200 text-slate-700 bg-slate-50/50'
                        }`}
                      >
                        <span className="truncate">
                          {cat.name} <span className="text-[11px] font-normal text-slate-400">({count})</span>
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NGUỒN ĐIỆN VẬN HÀNH */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Nguồn điện vận hành xưởng
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPower('')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      !currentPowerType
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    Tất cả nguồn điện
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPower(PowerType.THREE_PHASE_380V)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      currentPowerType === '380V' || currentPowerType === PowerType.THREE_PHASE_380V
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    ⚡ 380V (3 Pha)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPower(PowerType.SINGLE_PHASE_220V)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      currentPowerType === '220V' || currentPowerType === PowerType.SINGLE_PHASE_220V
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    🔌 220V (1 Pha)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQueryParam({ isQuoteOnly: currentIsQuoteOnly === 'true' ? '' : 'true' })}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      currentIsQuoteOnly === 'true'
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700 bg-slate-50/50'
                    }`}
                  >
                    📋 Báo giá RFQ B2B
                  </button>
                </div>
              </div>

              {/* TÌNH TRẠNG & ĐỘ MỚI */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Tình trạng máy tân trang
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={`mob-cond-${opt.value}`}
                      type="button"
                      onClick={() => handleSelectCondition(opt.value)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition ${
                        currentCondition === opt.value
                          ? 'border-amber-500 bg-amber-50 text-amber-950'
                          : 'border-slate-200 text-slate-700 bg-slate-50/50'
                      }`}
                    >
                      <span className="truncate block">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* KHOẢNG GIÁ */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Khoảng giá tham chiếu
                </span>
                <div className="space-y-1.5">
                  {PRICE_RANGES.map((range, index) => {
                    const isSelected =
                      String(range.min ?? '') === (currentMinPrice || '') &&
                      String(range.max ?? '') === (currentMaxPrice || '');

                    return (
                      <button
                        key={`mob-price-${index}`}
                        type="button"
                        onClick={() =>
                          updateQueryParam({
                            minPrice: range.min?.toString(),
                            maxPrice: range.max?.toString(),
                          })
                        }
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border font-bold transition ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-amber-950'
                            : 'border-slate-200 text-slate-700 bg-slate-50/50'
                        }`}
                      >
                        <span>{range.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* THƯƠNG HIỆU */}
              <div>
                <span className="font-bold text-slate-900 block mb-2 uppercase tracking-wider text-[11px]">
                  Thương hiệu sản xuất
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateQueryParam({ brandSlug: '' })}
                    className={`px-3 py-1.5 rounded-xl border font-bold transition ${
                      !currentBrand
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Tất cả
                  </button>
                  {brands.map((b) => (
                    <button
                      key={`mob-brand-${b.id}`}
                      type="button"
                      onClick={() => updateQueryParam({ brandSlug: b.slug })}
                      className={`px-3 py-1.5 rounded-xl border font-bold transition ${
                        currentBrand === b.slug
                          ? 'border-amber-500 bg-amber-50 text-amber-950'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Bottom Sheet: Nút Áp Dụng & Đặt Lại */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 text-xs hover:bg-slate-100"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={handleApplyMobileFilters}
                className="flex-2 py-3 rounded-xl bg-amber-500 font-black text-slate-950 text-xs shadow-md hover:bg-amber-400"
              >
                Áp dụng bộ lọc {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SIDEBAR BỘ LỌC CHO DESKTOP (HIỂN THỊ TỪ LG TRỞ LÊN) */}
      {/* ======================================================== */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24">
          {/* HEADER BỘ LỌC */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              <span className="font-bold text-slate-900">Bộ lọc thông số</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-amber-600"
              >
                <RotateCcw className="h-3 w-3" />
                Đặt lại
              </button>
            )}
          </div>

          {/* ĐỘ MỚI & TÌNH TRẠNG MÁY TÂN TRANG */}
          <div className="border-b border-slate-100 py-4">
            <button
              type="button"
              onClick={() => toggleSection('condition')}
              className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <span>Độ mới & Tình trạng</span>
              {openSections.condition ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openSections.condition && (
              <div className="mt-3 space-y-1">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectCondition(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                      currentCondition === opt.value
                        ? 'bg-amber-50 font-bold text-amber-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentCondition === opt.value && (
                      <Check className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DANH MỤC THIẾT BỊ */}
          <div className="border-b border-slate-100 py-4">
            <button
              type="button"
              onClick={() => toggleSection('category')}
              className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <span>Danh mục thiết bị</span>
              {openSections.category ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openSections.category && (
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('')}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    !currentCategory
                      ? 'bg-amber-50 font-bold text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Tất cả danh mục</span>
                  {!currentCategory && <Check className="h-3.5 w-3.5 text-amber-600" />}
                </button>

                {activeCategories.map((cat) => {
                  const count = cat._count?.products ?? 0;
                  const isSelected = currentCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.slug)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isSelected
                          ? 'bg-amber-50 font-bold text-amber-900'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate text-left">
                        {cat.name} <span className="text-[11px] font-normal text-slate-400">({count})</span>
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* NGUỒN ĐIỆN VẬN HÀNH */}
          <div className="border-b border-slate-100 py-4">
            <button
              type="button"
              onClick={() => toggleSection('power')}
              className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <span>Nguồn điện xưởng</span>
              {openSections.power ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openSections.power && (
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectPower('')}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    !currentPowerType
                      ? 'bg-amber-50 font-bold text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Tất cả nguồn điện</span>
                  {!currentPowerType && <Check className="h-3.5 w-3.5 text-amber-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPower(PowerType.THREE_PHASE_380V)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    currentPowerType === '380V' || currentPowerType === PowerType.THREE_PHASE_380V
                      ? 'bg-amber-50 font-bold text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    3 Pha 380V (Sản xuất)
                  </span>
                  {(currentPowerType === '380V' || currentPowerType === PowerType.THREE_PHASE_380V) && (
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPower(PowerType.SINGLE_PHASE_220V)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    currentPowerType === '220V' || currentPowerType === PowerType.SINGLE_PHASE_220V
                      ? 'bg-amber-50 font-bold text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-slate-500" />
                    1 Pha 220V (Dân dụng)
                  </span>
                  {(currentPowerType === '220V' || currentPowerType === PowerType.SINGLE_PHASE_220V) && (
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* HÃNG SẢN XUẤT */}
          <div className="border-b border-slate-100 py-4">
            <button
              type="button"
              onClick={() => toggleSection('brand')}
              className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <span>Hãng sản xuất</span>
              {openSections.brand ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openSections.brand && (
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectBrand('')}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                    !currentBrand
                      ? 'bg-amber-50 font-bold text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Tất cả thương hiệu</span>
                  {!currentBrand && <Check className="h-3.5 w-3.5 text-amber-600" />}
                </button>

                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBrand(b.slug)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                      currentBrand === b.slug
                        ? 'bg-amber-50 font-bold text-amber-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate text-left">{b.name}</span>
                    {currentBrand === b.slug && (
                      <Check className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* KHOẢNG GIÁ THAM CHIẾU */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection('price')}
              className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <span>Khoảng giá</span>
              {openSections.price ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openSections.price && (
              <div className="mt-3 space-y-1">
                {PRICE_RANGES.map((range, index) => {
                  const isSelected =
                    String(range.min ?? '') === (currentMinPrice || '') &&
                    String(range.max ?? '') === (currentMaxPrice || '');

                  return (
                    <button
                      key={`price-${index}`}
                      type="button"
                      onClick={() =>
                        updateQueryParam({
                          minPrice: range.min?.toString(),
                          maxPrice: range.max?.toString(),
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                        isSelected
                          ? 'bg-amber-50 font-bold text-amber-900'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-left">{range.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
