'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatVND, getApiBaseUrl } from '@/lib/utils';
import {
  Search,
  CheckCircle2,
  Clock,
  Building,
  User,
  Phone,
  MapPin,
  Zap,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Home,
  ChevronRight,
  Receipt,
  Layers,
} from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCode = searchParams.get('code') || searchParams.get('orderNumber') || '';
  const [searchCode, setSearchCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [trackingData, setTrackingData] = useState<{
    type: 'RFQ' | 'ORDER';
    code: string;
    customerName: string;
    companyName?: string | null;
    customerPhone?: string | null;
    address: string;
    powerSupply?: string;
    status: string;
    statusDetail?: { title: string; step: number; description: string };
    totalAmount?: number | string | null;
    depositAmount?: number | string | null;
    remainingAmount?: number | string | null;
    depositPercent?: number | null;
    createdAt: string;
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      price?: number | string | null;
      specs?: Record<string, unknown> | null;
    }>;
    payments?: Array<{
      paymentCode: string;
      milestoneType: string;
      amount: number | string;
      status: string;
      confirmedAt?: string | null;
    }>;
  } | null>(null);

  const handleLookup = useCallback(async (codeToSearch: string) => {
    const trimmed = codeToSearch.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Vui lòng nhập mã báo giá (BG-xxxx) hoặc mã đơn hàng (DH-xxxx)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTrackingData(null);

    // Cập nhật URL
    router.replace(`/tracking?code=${encodeURIComponent(trimmed)}`);

    const baseUrl = getApiBaseUrl();

    try {
      if (trimmed.startsWith('BG-') || trimmed.startsWith('RFQ-')) {
        // Tra cứu Báo Giá RFQ
        const res = await fetch(`${baseUrl}/quotations/${trimmed}`);
        const json = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message || `Không tìm thấy yêu cầu báo giá với mã: "${trimmed}"`);
        }

        const data = json.data;
        setTrackingData({
          type: 'RFQ',
          code: data.code,
          customerName: data.customerName,
          companyName: data.companyName,
          customerPhone: data.customerPhone,
          address: data.workshopAddress,
          powerSupply: data.targetPowerSupply,
          status: data.status,
          statusDetail: data.statusDetail,
          totalAmount: data.estimatedTotal,
          createdAt: data.createdAt,
          items: (data.items || []).map((it: any) => ({
            name: it.product?.name || 'Thiết bị làm bánh',
            sku: it.variant?.sku || it.product?.modelCode || 'N/A',
            quantity: it.requestedQuantity,
            price: it.offeredUnitPrice || it.targetUnitPrice,
            specs: {
              powerType: it.variant?.powerType,
              powerKw: it.variant?.powerKw,
            },
          })),
        });
      } else {
        // Tra cứu Đơn Hàng ORDER (DH-xxxx)
        const res = await fetch(`${baseUrl}/orders/${trimmed}`);
        const json = await res.json();

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message || `Không tìm thấy đơn hàng với mã: "${trimmed}"`);
        }

        const data = json.data;
        setTrackingData({
          type: 'ORDER',
          code: data.orderCode,
          customerName: data.customerName,
          companyName: data.companyName,
          customerPhone: data.customerPhone,
          address: data.shippingAddress,
          status: data.status,
          statusDetail: data.statusDetail,
          totalAmount: data.totalAmount,
          depositAmount: data.depositAmount,
          remainingAmount: data.remainingAmount,
          depositPercent: data.depositRequiredPercent ? Number(data.depositRequiredPercent) : 30,
          createdAt: data.createdAt,
          items: (data.items || []).map((it: any) => ({
            name: it.productName,
            sku: it.sku,
            quantity: it.quantity,
            price: it.unitPrice,
            specs: it.specsSnapshot,
          })),
          payments: data.payments || [],
        });
      }
    } catch (err: unknown) {
      console.warn('Lỗi tra cứu đơn hàng / báo giá:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : `Không tìm thấy thông tin cho mã: "${trimmed}". Vui lòng kiểm tra lại mã hoặc liên hệ Hotline để được hỗ trợ.`
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode, handleLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchCode);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="flex items-center gap-1 hover:text-amber-600">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">Tra cứu tiến độ báo giá & đơn hàng</span>
        </nav>

        {/* HEADER & SEARCH FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-900">
            🔍 Hệ Thống Tra Cứu Trực Tuyến
          </span>
          <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
            Tra Cứu Báo Giá (RFQ) & Tiến Độ Đơn Hàng
          </h1>
          <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
            Nhập <strong>Mã báo giá (BG-xxxx)</strong> hoặc <strong>Mã đơn hàng (DH-xxxx)</strong> để kiểm tra trạng thái khảo sát, chuẩn bị máy và các đợt thanh toán.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="VD: BG-202610-0001 hoặc DH-202610-0001"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tra cứu...
                </>
              ) : (
                'Kiểm tra ngay'
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* KẾT QUẢ TRA CỨU */}
        {trackingData && (
          <div className="mt-8 space-y-6">
            {/* THÔNG TIN TỔNG QUAN & TIẾN TRÌNH */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                      {trackingData.type === 'RFQ' ? 'BÁO GIÁ KỸ THUẬT' : 'ĐƠN HÀNG CHÍNH THỨC'}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      Tạo ngày {new Date(trackingData.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-black font-mono text-slate-900">
                    {trackingData.code}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Trạng thái hiện tại:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 shadow-xs">
                    <Clock className="h-3.5 w-3.5" />
                    {trackingData.statusDetail?.title || trackingData.status}
                  </span>
                </div>
              </div>

              {/* MÔ TẢ TRẠNG THÁI */}
              {trackingData.statusDetail?.description && (
                <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 text-xs text-amber-950 flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Cập nhật xử lý:</strong> {trackingData.statusDetail.description}
                  </p>
                </div>
              )}

              {/* THÔNG TIN XƯỞNG BÁNH & KHÁCH HÀNG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <span className="text-slate-400 flex items-center gap-1 mb-1">
                    <User className="h-3.5 w-3.5" /> Người phụ trách:
                  </span>
                  <strong className="text-slate-900 font-bold block">{trackingData.customerName}</strong>
                  {trackingData.customerPhone && (
                    <span className="text-slate-500 font-mono mt-0.5 block">{trackingData.customerPhone}</span>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <span className="text-slate-400 flex items-center gap-1 mb-1">
                    <Building className="h-3.5 w-3.5" /> Xưởng / Tiệm bánh:
                  </span>
                  <strong className="text-slate-900 font-bold block">
                    {trackingData.companyName || 'Cơ sở tư nhân'}
                  </strong>
                  <span className="text-slate-500 truncate block mt-0.5">{trackingData.address}</span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <span className="text-slate-400 flex items-center gap-1 mb-1">
                    <Zap className="h-3.5 w-3.5" /> Nguồn điện xưởng:
                  </span>
                  <strong className="text-amber-800 font-bold block">
                    {trackingData.powerSupply === 'THREE_PHASE_380V'
                      ? 'Điện 3 pha (380V) công nghiệp'
                      : 'Điện 1 pha (220V)'}
                  </strong>
                  <span className="text-slate-500 text-[11px] block mt-0.5">Khảo sát & bàn giao chạy thử</span>
                </div>
              </div>
            </div>

            {/* DANH SÁCH THIẾT BỊ TRONG ĐƠN / BÁO GIÁ */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600" />
                Danh sách thiết bị yêu cầu ({trackingData.items.length})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {trackingData.items.map((item, index) => (
                  <div key={`item-${index}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">Mã SKU: {item.sku}</span>
                        <span>• Số lượng: <strong>{item.quantity} máy</strong></span>
                      </div>
                    </div>
                    {item.price && (
                      <span className="font-bold text-slate-900 text-right">
                        {formatVND(item.price)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* TỔNG TIỀN VÀ CỌC (NẾU LÀ ĐƠN HÀNG) */}
              {trackingData.totalAmount && (
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    {trackingData.depositAmount && (
                      <p className="text-xs text-amber-800 font-semibold">
                        Tiền cọc Đợt 1 ({trackingData.depositPercent}%): <strong>{formatVND(trackingData.depositAmount)}</strong>
                      </p>
                    )}
                    {trackingData.remainingAmount && (
                      <p className="text-[11px] text-slate-500">
                        Còn lại nghiệm thu: <strong>{formatVND(trackingData.remainingAmount)}</strong>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Tổng giá trị:</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatVND(trackingData.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* LỊCH SỬ THANH TOÁN THEO ĐỢT (NẾU CÓ) */}
            {trackingData.payments && trackingData.payments.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-600" />
                  Tiến độ thanh toán theo đợt (Milestone Payments)
                </h3>

                <div className="space-y-3">
                  {trackingData.payments.map((p, idx) => (
                    <div
                      key={p.paymentCode}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {p.paymentCode}
                          </span>
                          <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                            {p.milestoneType === 'DEPOSIT_STAGE_1'
                              ? 'Đợt 1: Cọc sản xuất (30%)'
                              : p.milestoneType === 'PRE_DELIVERY_STAGE_2'
                              ? 'Đợt 2: Trước xuất xưởng'
                              : 'Đợt 3: Nghiệm thu bàn giao'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Trạng thái: <strong>{p.status === 'CONFIRMED' ? '✓ Đã nhận tiền' : 'Chờ chuyển khoản'}</strong>
                        </span>
                      </div>

                      <span className="text-sm font-black text-slate-900">
                        {formatVND(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/60 pb-20 pt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            Đang tải thông tin tra cứu...
          </div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
