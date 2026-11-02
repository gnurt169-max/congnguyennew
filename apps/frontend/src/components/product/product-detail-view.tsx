'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { formatVND, normalizeImagePath } from '@/lib/utils';
import { PowerType, ProductCondition, ProductAvailability } from '@industrial-bakery/shared-types';
import { useCart } from '@/context/cart-context';

// Dynamic import RFQ Modal chỉ nạp khi khách hàng click mở modal
const RfqModal = dynamic(
  () => import('@/components/rfq/rfq-modal').then((mod) => mod.RfqModal),
  { ssr: false },
);
import {
  Zap,
  ShieldCheck,
  FileDown,
  BookOpen,
  PhoneCall,
  ArrowRight,
  Check,
  ShoppingCart,
  ShoppingBag,
  Minus,
  Plus,
  Layers,
  Sparkles,
  Info,
  Wrench,
  Video,
  CalendarCheck,
  Tag,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Bell,
} from 'lucide-react';

export interface InspectionItem {
  item: string;
  status: 'PASSED' | 'FAILED' | 'ATTENTION';
  note: string;
}

export interface ProductDetailVariant {
  id: string;
  sku: string;
  name: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stockQuantity: number;
  isQuoteOnly: boolean;
  powerType: PowerType;
  powerKw?: number | string | null;
  weightKg?: number | string | null;
  dimensions?: string | null;
  barcode?: string | null;
  attributeValues?: Array<{
    attributeValue: {
      value: string;
      attribute: {
        name: string;
        unit?: string | null;
      };
    };
  }>;
}

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  modelCode?: string | null;
  summary?: string | null;
  description: string;
  isQuoteOnly: boolean;
  basePrice?: number | string | null;
  originalPrice?: number | string | null;
  condition?: ProductCondition | string | null;
  availability?: ProductAvailability | string | null;
  refurbishDetails?: string | null;
  testVideoUrl?: string | null;
  inspectionChecklist?: InspectionItem[] | null;
  currency?: string;
  thumbnail?: string | null;
  images?: string[] | null;
  videoUrl?: string | null;
  specSheetPdfUrl?: string | null;
  manualPdfUrl?: string | null;
  warrantyMonths: number;
  stock?: number;
  soldCount?: number;
  status?: string;
  note?: string;
  brand?: {
    name: string;
    slug: string;
    originCountry?: string | null;
    logoUrl?: string | null;
    description?: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      name: string;
      slug: string;
    } | null;
  };
  variants: ProductDetailVariant[];
}

interface ProductDetailViewProps {
  product: ProductDetailData;
}

// Helper nhãn hiển thị tình trạng độ mới
function getConditionBadge(cond?: string | null, details?: string | null) {
  if (details && details.trim().length > 0) {
    return {
      label: details,
      bg: 'bg-amber-50 text-amber-950 border-amber-300 font-bold',
      dot: 'bg-amber-500',
    };
  }
  switch (cond) {
    case 'LIKE_NEW_99':
      return {
        label: 'Mới 100% / Like New 99%',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        dot: 'bg-emerald-500',
      };
    case 'EXCELLENT_90_95':
      return {
        label: 'Độ mới 90% (Nguyên bản êm ái)',
        bg: 'bg-blue-50 text-blue-800 border-blue-300 font-bold',
        dot: 'bg-blue-500',
      };
    case 'REFURBISHED_FULL':
      return {
        label: 'Tân trang chuẩn xưởng (Full Refurbished)',
        bg: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
        dot: 'bg-amber-500',
      };
    case 'FAIR_80':
      return {
        label: 'Thanh lý tiệm bánh, nhiệt lên đều',
        bg: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
        dot: 'bg-slate-500',
      };
    default:
      return {
        label: 'Tân trang nguyên bản',
        bg: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
        dot: 'bg-amber-500',
      };
  }
}

// Helper trích xuất URL embed cho YouTube (watch, youtu.be, shorts)
function getEmbedVideoUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;

  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }

  return null;
}

// Helper kiểm tra file video trực tiếp (mp4, webm)
function isDirectVideoFile(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  const lower = rawUrl.trim().toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?')
  );
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  // Xử lý video test máy chạy thực tế: Kiểm tra tính hợp lệ của đường dẫn
  const rawVideoUrl = product.testVideoUrl || product.videoUrl;
  const activeVideoUrl = typeof rawVideoUrl === 'string' ? rawVideoUrl.trim() : '';
  const hasVideo = Boolean(activeVideoUrl && activeVideoUrl.length > 5);
  const embedUrl = hasVideo ? getEmbedVideoUrl(activeVideoUrl) : null;
  const isDirectVideo = hasVideo ? isDirectVideoFile(activeVideoUrl) : false;

  // Ảnh gallery (chuẩn hoá hỗ trợ imageUrl, thumbnail và mảng images)
  const rawImages = [
    ...((product as any).imageUrl ? [(product as any).imageUrl] : []),
    ...(product.thumbnail && product.thumbnail !== (product as any).imageUrl ? [product.thumbnail] : []),
    ...(product.images && Array.isArray(product.images)
      ? product.images.map((im: any) => (typeof im === 'string' ? im : im?.url)).filter(Boolean)
      : []),
  ];
  const allImages = rawImages.map((im) => normalizeImagePath(im)).filter(Boolean);
  const [selectedImage, setSelectedImage] = useState<string>(
    allImages[0] || '/placeholder-machine.svg',
  );

  // Tự động đồng bộ ảnh hiển thị khi dữ liệu sản phẩm thay đổi
  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
    } else {
      setSelectedImage('/placeholder-machine.svg');
    }
  }, [product.id, product.thumbnail, (product as any).imageUrl, JSON.stringify(product.images)]);

  // Biến thể đang chọn
  const [selectedVariant, setSelectedVariant] = useState<ProductDetailVariant | null>(
    product.variants?.[0] || null,
  );

  // Số lượng mua bán lẻ
  const [quantity, setQuantity] = useState(1);

  // State mở Modal RFQ & Modal Đăng ký thử máy
  const router = useRouter();
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);
  const [testDriveSuccess, setTestDriveSuccess] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Context giỏ hàng
  const { addItem, openCart } = useCart();

  // Tính toán mức giá
  const currentPrice = selectedVariant?.price ?? product.basePrice;
  const originalMarketPrice = selectedVariant?.originalPrice ?? product.originalPrice;

  // Tính số tiền và % tiết kiệm
  let savingsAmount = 0;
  let savingsPercent = 0;
  if (currentPrice && originalMarketPrice) {
    const cur = Number(currentPrice);
    const orig = Number(originalMarketPrice);
    if (orig > cur) {
      savingsAmount = orig - cur;
      savingsPercent = Math.round((savingsAmount / orig) * 100);
    }
  }

  const condBadge = getConditionBadge(product.condition, product.refurbishDetails);

  // Tính tồn kho thực tế & trạng thái hết hàng
  const stock =
    product.stock !== undefined
      ? Number(product.stock)
      : product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 1;

  const isOutOfStock =
    stock <= 0 ||
    product.status === 'out_of_stock' ||
    product.availability === 'SOLD' ||
    product.availability === ProductAvailability.SOLD;

  const scarcityText = isOutOfStock
    ? '🔴 Đã bán hết (0 máy tại kho)'
    : product.note ||
      (stock <= 3
        ? `⚡ Còn lại: ${stock} máy kho Đông Hưng Thuận (Bao test tải)`
        : `⚡ Còn lại: ${stock} máy sẵn tại kho`);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        variantName: selectedVariant?.name,
        sku: selectedVariant?.sku || product.modelCode || `CN-${product.id.slice(0, 8)}`,
        price: Number(currentPrice) || 0,
        thumbnail: selectedImage || product.thumbnail,
        isQuoteOnly: false,
        powerType: selectedVariant?.powerType || PowerType.SINGLE_PHASE_220V,
      },
      quantity,
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
    openCart();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        variantName: selectedVariant?.name,
        sku: selectedVariant?.sku || product.modelCode || `CN-${product.id.slice(0, 8)}`,
        price: Number(currentPrice) || 0,
        thumbnail: selectedImage || product.thumbnail,
        isQuoteOnly: false,
        powerType: selectedVariant?.powerType || PowerType.SINGLE_PHASE_220V,
      },
      quantity,
    );
    router.push('/checkout');
  };

  const handleOpenRfq = () => {
    setIsRfqModalOpen(true);
  };

  const handleTestDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTestDriveSuccess(true);
    setTimeout(() => {
      setTestDriveSuccess(false);
      setIsTestDriveOpen(false);
    }, 2000);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-12 lg:items-start">
        {/* ======================================================== */}
        {/* CỘT TRÁI (45% - 50%): MEDIA GALLERY & QUY CHUẨN KIỂM ĐỊNH */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          {/* Ảnh lớn chính (Bo góc rounded-2xl, có badge trạng thái "Đã kiểm định / Like New 99%") */}
          <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={`Thiết bị làm bánh - ${product.name}`}
                fill
                priority={true}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover object-center transition-all duration-300 ${
                  isOutOfStock ? 'grayscale-40' : ''
                }`}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-radial from-slate-100 to-slate-200/80 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 text-amber-600">
                  <span className="text-xl font-black tracking-tight font-serif">CN</span>
                </div>
                <span className="mt-3 text-sm font-bold text-slate-700 tracking-tight">CÔNG NGUYÊN BAKERY</span>
                <span className="text-xs text-slate-400 mt-0.5">Hình ảnh thực tế đang được cập nhật</span>
              </div>
            )}

            {/* Huy hiệu ĐÃ BÁN / HẾT HÀNG phủ lên ảnh chính */}
            {isOutOfStock && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs">
                <span className="rounded-2xl border border-white/30 bg-red-600 px-5 py-2.5 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-2xl">
                  ĐÃ BÁN / HẾT HÀNG
                </span>
              </div>
            )}

            {/* Badges trạng thái trên ảnh */}
            <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${condBadge.bg}`}>
                <span className={`h-2 w-2 rounded-full ${condBadge.dot}`} />
                {condBadge.label}
              </span>
            </div>

            {product.modelCode && (
              <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5">
                <span className="rounded-lg border border-slate-300/60 bg-white/95 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 shadow-sm backdrop-blur-sm">
                  Model: {product.modelCode}
                </span>
              </div>
            )}
          </div>

          {/* Dải ảnh thumbnails thu nhỏ bên dưới */}
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 touch-pan-x snap-x no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-[4/3] w-16 sm:w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                    selectedImage === img
                      ? 'border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Góc chụp thiết bị ${product.name} (${idx + 1})`}
                    fill
                    loading="lazy"
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Khung nhỏ gọn gàng: Quy chuẩn kiểm định máy tại Công Nguyên */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Quy chuẩn kiểm định máy tại Công Nguyên:</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              15 hạng mục cơ điện: đo dòng động cơ, kiểm tra bạc đạn, rơ-le nhiệt, điện áp cách điện an toàn và test nướng/nhào thực tế trước khi xuất kho bàn giao.
            </p>
            {product.refurbishDetails && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Chi tiết đại tu:</strong> {product.refurbishDetails}</span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CỘT PHẢI (50% - 55%): THÔNG TIN & MUA HÀNG (STICKY COLUMN) */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-5 lg:sticky lg:top-24">
          {/* TÊN SẢN PHẨM IN ĐẬM KÍCH THƯỚC LỚN */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            {product.name}
          </h1>

          {/* HÀNG PHỤ: THƯƠNG HIỆU, MODEL, SKU, TÌNH TRẠNG KHO */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {product.brand && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-800">
                Hãng: <strong className="text-slate-900">{product.brand.name}</strong>
                {product.brand.originCountry && <span className="text-slate-500">({product.brand.originCountry})</span>}
              </span>
            )}

            {product.modelCode && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-700">
                Model: <strong className="text-slate-900">{product.modelCode}</strong>
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-slate-600">
              SKU: {selectedVariant?.sku || product.modelCode || `CN-${product.id.slice(0, 8)}`}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold ${
                isOutOfStock
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span>
                {isOutOfStock
                  ? 'Đã bán hết (0 máy tại kho)'
                  : stock === 1
                  ? 'Còn 1 máy duy nhất'
                  : `Còn ${stock} máy tại kho`}
              </span>
            </span>
          </div>

          {/* KHỐI GIÁ BÁN TRỰC QUAN (GIÁ TÂN TRANG + GIÁ MÁY MỚI & TIẾT KIỆM NGAY CẠNH) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Giá máy tân trang bảo hành tận nơi:
            </span>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">
                {currentPrice ? formatVND(currentPrice) : 'Liên hệ báo giá'}
              </span>

              {originalMarketPrice && Number(originalMarketPrice) > Number(currentPrice || 0) && (
                <>
                  <span className="text-sm sm:text-base line-through text-slate-400 font-medium">
                    ~{formatVND(originalMarketPrice)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>-{savingsPercent}% (Tiết kiệm {formatVND(savingsAmount)})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* TÓM TẮT KỸ THUẬT NGẮN GỌN */}
          {product.summary && (
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {product.summary}
            </p>
          )}

          {/* TÙY CHỌN CẤU HÌNH ĐIỆN ÁP / CÔNG SUẤT MÁY (DẠNG PILL BẤM NHANH) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                Cấu hình điện áp & công suất:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const is3Phase = v.powerType === PowerType.THREE_PHASE_380V;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{is3Phase ? '380V (3 Pha)' : '220V (1 Pha)'}</span>
                      {v.powerKw && (
                        <span className={isSelected ? 'text-slate-900/80 font-normal' : 'text-slate-500 font-normal'}>
                          • {v.powerKw} kW
                        </span>
                      )}
                      {v.price && (
                        <span className={isSelected ? 'text-slate-950 font-black' : 'text-amber-700 font-bold'}>
                          ({formatVND(v.price)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SỐ LƯỢNG MUA / CỌC */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-600">Số lượng:</span>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(stock > 0 ? stock : 1, q + 1))}
                  disabled={quantity >= stock}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                ({stock === 1 ? 'Chỉ có 1 máy tại kho' : `Tối đa ${stock} máy`})
              </span>
            </div>
          )}

          {/* CỤM NÚT HÀNH ĐỘNG THƯƠNG MẠI HOẶC XỬ LÝ HẾT HÀNG */}
          {isOutOfStock ? (
            <div className="space-y-3 pt-2">
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>Máy này hiện <strong>đã chốt bán</strong>. Quý khách vui lòng để lại thông tin để nhận báo giá ưu tiên khi có máy tương đương về kho!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleOpenRfq}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 py-3.5 px-4 text-sm font-bold text-slate-950 shadow-md transition cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  <span>Đăng ký nhận máy tương đương</span>
                </button>

                <a
                  href={`https://zalo.me/0976619044?text=${encodeURIComponent(`Chào Công Nguyên, tôi muốn tư vấn máy tương tự cho: ${product.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-900 hover:text-white active:scale-98 py-3.5 px-4 text-sm font-bold text-slate-900 shadow-sm transition"
                >
                  <PhoneCall className="h-4 w-4 text-emerald-600" />
                  <span>Zalo tư vấn kỹ thuật</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NÚT 1: THÊM VÀO GIỎ HÀNG */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-sm sm:text-base py-3.5 px-4 transition-all shadow-2xs active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="h-5 w-5 text-amber-600" />
                  <span>{addedToast ? '✓ Đã thêm vào giỏ!' : 'Thêm vào giỏ hàng'}</span>
                </button>

                {/* NÚT 2: ĐẶT CỌC GIỮ MÁY NGAY */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base py-3.5 px-4 shadow-md shadow-amber-500/25 transition-all active:scale-98 cursor-pointer"
                >
                  <Zap className="h-5 w-5 text-slate-950" />
                  <span>Đặt cọc giữ máy ngay</span>
                </button>
              </div>

              {/* NÚT PHỤ HOTLINE/ZALO THU GỌN THANH LỊCH */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <a
                  href="https://zalo.me/0976619044"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-700 transition"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tư vấn kỹ thuật: <strong className="text-slate-900">0976 619 044</strong></span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsTestDriveOpen(true)}
                  className="font-semibold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <CalendarCheck className="h-3.5 w-3.5 text-amber-600" />
                  <span>Hẹn lịch test máy tại xưởng</span>
                </button>
              </div>
            </div>
          )}

          {/* KHỐI CAM KẾT DỊCH VỤ (3 ICON BULLETS TỐI GIẢN, TINH TẾ) */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Bảo hành kỹ thuật tận nơi <strong>{product.warrantyMonths || 12} tháng</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Đổi trả nếu phát sinh lỗi kỹ thuật trong <strong>7 ngày</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Wrench className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Hỗ trợ mang bột đến xưởng test máy thực tế (Đông Hưng Thuận, Q.12)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KHỐI VIDEO TEST MÁY VẬN HÀNH (CHỈ HIỂN THỊ KHI CÓ LINK VIDEO HỢP LỆ) */}
      {/* ======================================================== */}
      {hasVideo && (
        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Video test máy vận hành thực tế tại xưởng
                </h2>
              </div>
              <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-800">
                Quay thực tế tại xưởng
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 aspect-video relative shadow-md">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`Video test máy ${product.name} tại xưởng Công Nguyên`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video
                  src={activeVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                  poster={product.thumbnail || undefined}
                >
                  Trình duyệt của bạn không hỗ trợ phát thẻ video.
                </video>
              ) : (
                <div className="text-center p-6 text-white space-y-3 flex flex-col items-center justify-center h-full">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-lg hover:scale-105 transition">
                    <Video className="h-7 w-7 fill-current" />
                  </div>
                  <div className="text-sm font-bold">Video chạy thử máy thực tế tại xưởng</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Kỹ thuật viên quay rõ độ êm của động cơ, độ đầm và các thông số vận hành thực tế.
                  </p>
                  <a
                    href={activeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Mở video kiểm định trực tiếp ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* BÀI TOÁN TỐI ƯU VỐN MỞ TIỆM BÁNH (ĐƯA XUỐNG DƯỚI DẠNG SECTION CHI TIẾT) */}
      {/* ======================================================== */}
      <section className="mt-12 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/50 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 font-bold text-slate-950 shadow-sm text-lg">
            💡
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Bài toán tối ưu vốn mở tiệm bánh cùng Công Nguyên
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
              Lựa chọn dòng máy tân trang chuẩn kỹ thuật này giúp bạn tiết kiệm ngay{' '}
              <strong className="text-emerald-700 font-bold text-sm sm:text-base">
                {savingsAmount > 0 ? formatVND(savingsAmount) : 'hàng chục triệu đồng'}
              </strong>{' '}
              {savingsPercent > 0 && `(-${savingsPercent}%) `}
              so với mua mới 100% ngoài thị trường. Toàn bộ máy đã được kỹ sư cơ điện Công Nguyên kiểm tra tỉ mỉ, thay thế linh kiện hao mòn chính hãng và cân chỉnh nhiệt độ hoàn hảo trước khi giao.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* THÔNG SỐ KỸ THUẬT & MÔ TẢ NGUYÊN LÝ */}
      {/* ======================================================== */}
      <section className="mt-10 border-t border-slate-200 pt-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* CỘT THÔNG SỐ (6 COLS) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Thông số kỹ thuật chi tiết
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs min-w-[340px]">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-500 w-1/3">Dòng máy</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{product.name}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-500">Mã model máy</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{product.modelCode || 'N/A'}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-500">Tình trạng độ mới</td>
                    <td className="py-3 px-4 text-amber-900 font-bold">{condBadge.label}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-500">Nguồn điện vận hành</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      {selectedVariant?.powerType === PowerType.THREE_PHASE_380V
                        ? '3 Pha (380V / 50Hz) - Điện sản xuất'
                        : selectedVariant?.powerType === PowerType.SINGLE_PHASE_220V
                        ? '1 Pha (220V / 50Hz) - Điện dân dụng'
                        : 'Cơ khí'}
                    </td>
                  </tr>
                  {selectedVariant?.powerKw && (
                    <tr className="bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-500">Công suất motor</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{selectedVariant.powerKw} kW</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-500">Thời gian bảo hành</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{product.warrantyMonths} tháng tại xưởng</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CỘT MÔ TẢ ĐẠI TU (6 COLS) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Lịch sử máy & Mô tả chi tiết đại tu
              </h2>
            </div>

            <div
              className="prose prose-slate prose-sm max-w-none rounded-2xl border border-slate-200 bg-white p-6 leading-relaxed shadow-xs"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODAL FORM YÊU CẦU BÁO GIÁ & ĐẶT CỌC GIỮ MÁY (LAZY LOADED) */}
      {/* ======================================================== */}
      {isRfqModalOpen && (
        <RfqModal
          isOpen={isRfqModalOpen}
          onClose={() => setIsRfqModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            modelCode: product.modelCode,
            thumbnail: product.thumbnail,
            isQuoteOnly: true,
            selectedVariant: selectedVariant
              ? {
                  id: selectedVariant.id,
                  sku: selectedVariant.sku,
                  name: selectedVariant.name,
                  powerType: selectedVariant.powerType,
                  powerKw: selectedVariant.powerKw,
                  price: selectedVariant.price,
                }
              : null,
          }}
        />
      )}

      {/* ======================================================== */}
      {/* THANH HÀNH ĐỘNG DÍNH ĐÁY DI ĐỘNG (STICKY PRODUCT CTA) */}
      {/* Nằm ngay trên Bottom Nav (bottom-16 md:hidden) */}
      {/* ======================================================== */}
      <div className="fixed bottom-16 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-500 font-semibold block truncate">
            Giá máy tân trang:
          </span>
          <span className="text-sm font-black text-amber-700 block truncate">
            {currentPrice ? formatVND(currentPrice) : 'Liên hệ báo giá'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOutOfStock ? (
            <button
              type="button"
              onClick={handleOpenRfq}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Chờ máy tương tự</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex items-center gap-1 rounded-xl border border-amber-500 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-2xs"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                <span>{addedToast ? 'Đã thêm' : 'Thêm giỏ'}</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md"
              >
                <Zap className="h-3.5 w-3.5 text-slate-950" />
                <span>Đặt cọc</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL ĐĂNG KÝ ĐẾN XƯỞNG TEST MÁY */}
      {/* ======================================================== */}
      {isTestDriveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-amber-600" />
              Hẹn lịch chạy thử máy tại xưởng
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Địa chỉ xưởng: Kho Máy Làm Bánh Công Nguyên, TP. Hồ Chí Minh. Khách hàng được mang bột và nguyên liệu riêng để test trực tiếp.
            </p>

            {testDriveSuccess ? (
              <div className="my-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-sm font-bold text-emerald-900">
                  Đăng ký thành công!
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Kỹ sư kỹ thuật sẽ gọi điện xác nhận và chuẩn bị máy sẵn sàng trước khi quý khách đến.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTestDriveSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Họ tên của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Anh Minh"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0908 123 456"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Ngày dự kiến đến test *</label>
                  <input
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Loại bánh / Yêu cầu chạy thử</label>
                  <input
                    type="text"
                    placeholder="VD: Thử nhào 20kg bột bánh mì baguette"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="mt-5 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTestDriveOpen(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    Xác nhận đặt lịch
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
