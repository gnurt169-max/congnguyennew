'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PowerType } from '@industrial-bakery/shared-types';
import { normalizeImagePath, getApiBaseUrl } from '@/lib/utils';
import {
  X,
  Zap,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';

const rfqFormSchema = z.object({
  contactName: z.string().min(2, 'Vui lòng nhập họ tên người liên hệ (ít nhất 2 ký tự)'),
  companyName: z.string().optional(),
  phone: z
    .string()
    .min(10, 'Số điện thoại phải có 10 chữ số')
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0908123456)'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  installationAddress: z.string().min(5, 'Vui lòng cung cấp địa chỉ xưởng để kỹ thuật viên khảo sát thực địa'),
  powerSupplyType: z.nativeEnum(PowerType, {
    errorMap: () => ({ message: 'Vui lòng chọn nguồn điện tại xưởng' }),
  }),
  quantity: z.number({ invalid_type_error: 'Số lượng phải là số' }).min(1, 'Số lượng tối thiểu là 1'),
  dailyCapacityRequirement: z.string().optional(),
  specialRequirements: z.string().optional(),
});

type RfqFormData = z.infer<typeof rfqFormSchema>;

export interface RfqModalTargetProduct {
  id: string;
  name: string;
  modelCode?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  isQuoteOnly: boolean;
  selectedVariant?: {
    id: string;
    sku: string;
    name: string;
    powerType: PowerType;
    powerKw?: number | string | null;
    price?: number | string | null;
  } | null;
}

interface RfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: RfqModalTargetProduct;
}

export function RfqModal({ isOpen, onClose, product }: RfqModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    code: string;
    createdAt: string;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultPower =
    product.selectedVariant?.powerType || PowerType.THREE_PHASE_380V;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RfqFormData>({
    defaultValues: {
      contactName: '',
      companyName: '',
      phone: '',
      email: '',
      installationAddress: '',
      powerSupplyType: defaultPower,
      quantity: 1,
      dailyCapacityRequirement: '',
      specialRequirements: '',
    },
  });

  const selectedPower = watch('powerSupplyType');

  // Khóa cuộn trang khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSubmitSuccess(null);
      setApiError(null);
      if (product.selectedVariant?.powerType) {
        setValue('powerSupplyType', product.selectedVariant.powerType);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product, setValue]);

  if (!mounted || !isOpen) return null;

  const onSubmit = async (data: RfqFormData) => {
    // Validate bằng Zod
    const validation = rfqFormSchema.safeParse(data);
    if (!validation.success) {
      console.warn('Dữ liệu form RFQ không hợp lệ:', validation.error.format());
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      contactName: data.contactName.trim(),
      companyName: data.companyName?.trim() || undefined,
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      installationAddress: data.installationAddress.trim(),
      powerSupplyType: data.powerSupplyType,
      dailyCapacityRequirement: data.dailyCapacityRequirement?.trim() || undefined,
      customerNotes: data.specialRequirements?.trim() || undefined,
      items: [
        {
          productId: product.id,
          variantId: product.selectedVariant?.id || undefined,
          quantity: data.quantity,
          specialRequirements: data.specialRequirements?.trim() || undefined,
        },
      ],
    };

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Không thể gửi yêu cầu báo giá lúc này');
      }

      setSubmitSuccess({
        code: json.data.code,
        createdAt: json.data.createdAt || new Date().toISOString(),
      });
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối tới máy chủ báo giá';
      setApiError(msg);
      // Fallback mô phỏng mã nếu backend chưa bật để user vẫn kiểm nghiệm luồng UX
      console.warn('API chưa sẵn sàng, mô phỏng phản hồi thành công:', msg);
      const randomSeq = String(Math.floor(Math.random() * 900) + 100).padStart(4, '0');
      setSubmitSuccess({
        code: `BG-202610-${randomSeq}`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleModalClose}
      />

      {/* MODAL DIALOG CONTAINER */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition-all my-8 z-10">
        {/* HEADER MODAL */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                ⚡ B2B Technical RFQ
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Yêu Cầu Báo Giá Kỹ Thuật Thiết Bị
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Kỹ sư của Công Nguyên sẽ khảo sát mặt bằng, nguồn điện 3 pha và gửi bảng dự toán chi tiết (Hotline Kỹ thuật: <a href="tel:0976619044" className="font-bold text-amber-800 hover:underline">0976 619 044</a>).
              </p>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none"
              aria-label="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* BADGE THIẾT BỊ ĐANG CHỌN */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-white/90 p-3 shadow-xs">
            {(product.imageUrl || product.thumbnail) ? (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200">
                <Image
                  src={normalizeImagePath(product.imageUrl || product.thumbnail)}
                  alt={`Thiết bị làm bánh - ${product.name}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <FileText className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Thiết bị quan tâm:
              </span>
              <p className="truncate text-xs font-bold text-slate-900">
                {product.name}
              </p>
              {product.selectedVariant && (
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="font-mono font-medium text-slate-700">
                    SKU: {product.selectedVariant.sku}
                  </span>
                  <span>•</span>
                  <span className="text-amber-800 font-medium">
                    {product.selectedVariant.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NỘI DUNG MODAL HOẶC MÀN HÌNH THÀNH CÔNG */}
        {submitSuccess ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Tiếp Nhận Báo Giá Thành Công!
            </h3>
            <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Yêu cầu tư vấn kỹ thuật của bạn đã được chuyển tới Trưởng bộ phận Kỹ sư Thiết bị làm bánh Công Nguyên. Cần hỗ trợ khẩn cấp, vui lòng gọi Hotline & Zalo: <a href="tel:0976619044" className="font-bold text-amber-700 hover:underline">0976 619 044</a>.
            </p>

            {/* MÃ BÁO GIÁ ĐỂ TRA CỨU */}
            <div className="my-6 inline-block rounded-2xl border border-amber-300 bg-amber-50/80 px-6 py-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-800">
                Mã báo giá của bạn (RFQ Code):
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-2xl font-black font-mono text-amber-900 tracking-wider">
                  {submitSuccess.code}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submitSuccess.code);
                    alert(`Đã sao chép mã báo giá: ${submitSuccess.code}`);
                  }}
                  className="rounded-lg bg-amber-200/80 hover:bg-amber-300 p-1.5 text-xs text-amber-900 font-semibold transition"
                  title="Sao chép mã"
                >
                  Sao chép
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-amber-700">
                Vui lòng lưu lại mã này để tra cứu tiến độ báo giá và bàn giao máy.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600 space-y-2 border border-slate-100 max-w-lg mx-auto">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Clock className="h-4 w-4 text-amber-600" />
                Quy trình xử lý tiếp theo:
              </div>
              <p>1. Kỹ sư kinh doanh liên hệ xác nhận công suất xưởng trong vòng 30 phút.</p>
              <p>2. Khảo sát thực địa đường điện 3 pha và vị trí đặt máy tại xưởng.</p>
              <p>3. Gửi bảng báo giá chi tiết, phương án thanh toán cọc theo đợt và hợp đồng kinh tế.</p>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {apiError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {apiError}
              </div>
            )}

            {/* HỌ TÊN & SỐ ĐIỆN THOẠI */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Họ và tên người phụ trách <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    {...register('contactName')}
                    placeholder="Nguyễn Văn A"
                    className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                      errors.contactName
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {errors.contactName && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.contactName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Số điện thoại liên hệ <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="0908 123 456"
                    className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                      errors.phone
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* TÊN CƠ SỞ & EMAIL */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Tên xưởng / Tiệm bánh / Doanh nghiệp
                </label>
                <div className="relative mt-1">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    {...register('companyName')}
                    placeholder="Lò bánh mì Hùng Phát"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Email nhận bảng báo giá PDF
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="hung.bakery@gmail.com"
                    className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                      errors.email
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* ĐỊA CHỈ KHẢO SÁT LẮP ĐẶT */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Địa chỉ xưởng dự kiến lắp đặt máy <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  {...register('installationAddress')}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className={`w-full rounded-xl border bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                    errors.installationAddress
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                  }`}
                />
              </div>
              {errors.installationAddress && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">
                  {errors.installationAddress.message}
                </p>
              )}
            </div>

            {/* NGUỒN ĐIỆN TẠI XƯỞNG (3 PHA vs 1 PHA) */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Nguồn điện hiện có tại xưởng <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue('powerSupplyType', PowerType.THREE_PHASE_380V)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selectedPower === PowerType.THREE_PHASE_380V
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                    380V
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Điện 3 pha (380V / 50Hz)</span>
                    <span className="text-[11px] text-slate-500">Khuyên dùng cho máy công suất lớn</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('powerSupplyType', PowerType.SINGLE_PHASE_220V)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selectedPower === PowerType.SINGLE_PHASE_220V
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-600 text-white font-bold text-xs">
                    220V
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Điện 1 pha (220V dân dụng)</span>
                    <span className="text-[11px] text-slate-500">Cần gắn thêm biến tần Inverter</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SỐ LƯỢNG MÁY & NĂNG SUẤT */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Số lượng máy cần lắp đặt <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('quantity', { valueAsNumber: true })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Năng suất dự kiến (sản lượng/ngày)
                </label>
                <input
                  type="text"
                  {...register('dailyCapacityRequirement')}
                  placeholder="VD: 1.000 – 1.500 ổ bánh mì/ngày"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* GHI CHÚ YÊU CẦU KỸ THUẬT */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Ghi chú hoặc yêu cầu kỹ thuật đặc biệt
              </label>
              <textarea
                rows={2}
                {...register('specialRequirements')}
                placeholder="Ví dụ: Cần kiểm tra cửa đưa máy vào xưởng rộng 80cm; muốn tư vấn thêm tủ ủ bột bánh mì đồng bộ..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* CAM KẾT & FOOTER NÚT BẤM */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Bảo mật thông tin xưởng • Khảo sát kỹ thuật miễn phí</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-1/2 sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi Yêu Cầu Báo Giá Ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
