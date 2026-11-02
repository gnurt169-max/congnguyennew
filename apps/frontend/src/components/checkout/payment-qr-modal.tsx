'use client';

import React, { useState, useEffect } from 'react';
import { formatVND, normalizeVietnamesePhoneNumber, getApiBaseUrl } from '@/lib/utils';
import {
  QrCode,
  Building,
  Smartphone,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  X,
  ExternalLink,
  Info,
  HelpCircle,
} from 'lucide-react';

export interface PaymentConfigData {
  bankId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  isBankEnabled?: boolean;
  momoPhone?: string | null;
  momoName?: string | null;
  momoQrUrl?: string | null;
  isMomoEnabled?: boolean;
}

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  depositAmount: number;
  totalAmount: number;
  depositPercent: number;
  paymentMethod: 'VIETQR' | 'MOMO';
  paymentConfig?: PaymentConfigData | null;
  onConfirmPaid?: () => void;
}

export function PaymentQrModal({
  isOpen,
  onClose,
  orderCode,
  depositAmount,
  totalAmount,
  depositPercent,
  paymentMethod: initialMethod,
  paymentConfig: initialConfig,
  onConfirmPaid,
}: PaymentQrModalProps) {
  const [method, setMethod] = useState<'VIETQR' | 'MOMO'>(initialMethod || 'VIETQR');
  const [momoQrType, setMomoQrType] = useState<'P2P' | 'VIETQR_MOMO'>('P2P');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [fetchedConfig, setFetchedConfig] = useState<PaymentConfigData | null>(null);

  // Tải cấu hình thanh toán động từ backend nếu chưa có trong props
  useEffect(() => {
    if (isOpen && !initialConfig) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/payment/config`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const cfg = data.data || data;
            setFetchedConfig(cfg);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const activeConfig = initialConfig || fetchedConfig;

  // Lấy dữ liệu cấu hình hoặc fallback chuẩn thực tế của Công Nguyên (Cố định TPBank)
  const bankId = 'TPB';
  const bankName = activeConfig?.bankName || 'TPBank (Ngân hàng Tiên Phong)';
  const accountNumber = (activeConfig?.accountNumber || '1029384756').trim();
  const accountHolder = (activeConfig?.accountHolder || 'CONG TY TNHH THIET BI BANH CONG NGUYEN').trim();

  // Chuẩn hóa số điện thoại MoMo: bỏ khoảng trắng, dấu +, đưa về 10 số bắt đầu bằng 0
  const rawMomoPhone = activeConfig?.momoPhone || '0976619044';
  const momoPhone = normalizeVietnamesePhoneNumber(rawMomoPhone) || '0976619044';
  const momoName = (activeConfig?.momoName || 'CONG NGUYEN MACHINERY').trim();

  // Nội dung chuyển khoản chuẩn
  const transferContent = `COC ${orderCode}`;

  // 1. Sinh link VietQR Ngân hàng (EMVCo chuẩn quốc gia - Cố định TPBank)
  const vietQrUrl = `https://img.vietqr.io/image/TPB-${accountNumber}-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(orderCode)}`;

  // 2. Mã QR chuẩn MoMo (ảnh QR tĩnh .webp đã upload từ Admin hoặc fallback)
  const activeMomoQrUrl = activeConfig?.momoQrUrl || '/uploads/payment/momo-qr.webp';
  const currentQrUrl = method === 'VIETQR' ? vietQrUrl : activeMomoQrUrl;

  // 4. MoMo Deep Link & Web Link hỗ trợ người dùng click thanh toán trực tiếp trên mobile
  const momoDeepLink = `momo://?action=p2p&phone=${momoPhone}&amount=${depositAmount}&comment=${encodeURIComponent(transferContent)}`;
  const momoWebPayUrl = `https://nhantien.momo.vn/${momoPhone}/${depositAmount}`;

  const handleOpenMoMoApp = () => {
    // Thử kích hoạt App MoMo qua Custom URL Scheme
    window.location.href = momoDeepLink;

    // Dự phòng mở Web Link sau 1.5s nếu máy chưa cài App
    setTimeout(() => {
      window.open(momoWebPayUrl, '_blank');
    }, 1500);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);

    // Phản hồi rung nhẹ trên điện thoại di động
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(currentQrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR-${method}-${orderCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback mở ảnh trong tab mới
      window.open(currentQrUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFinish = () => {
    setIsCompleted(true);
    if (onConfirmPaid) {
      onConfirmPaid();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto">
        {/* NÚT ĐÓNG MODAL */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {isCompleted ? (
          /* MÀN HÌNH HOÀN TẤT SAU KHI XÁC NHẬN CHUYỂN KHOẢN */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Đã ghi nhận thông tin đặt cọc!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Hệ thống kế toán Công Nguyên đang tiến hành đối soát giao dịch cho đơn hàng{' '}
              <strong className="text-slate-900 font-mono font-bold">{orderCode}</strong>.
              Bộ phận kỹ thuật sẽ liên hệ trong vòng 15 phút để chốt tiến độ bàn giao thiết bị.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
              >
                Đã hiểu & Về trang đơn hàng
              </button>
            </div>
          </div>
        ) : (
          /* NỘI DUNG THANH TOÁN QR ĐỘNG */
          <div className="space-y-4">
            {/* TIÊU ĐỀ HỘP THOẠI */}
            <div className="text-center pr-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Thanh Toán Đặt Cọc Bảo Lưu Máy ({depositPercent}%)</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Quét Mã QR Chuyển Tiền Cọc Tự Động
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã đơn hàng: <strong className="font-mono text-slate-900">{orderCode}</strong> •
                Tổng giá trị: <strong className="text-slate-900">{formatVND(totalAmount)}</strong>
              </p>
            </div>

            {/* TAB CHỌN PHƯƠNG THỨC: VIETQR HOẶC MOMO */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100/80 border border-slate-200">
              <button
                type="button"
                onClick={() => setMethod('VIETQR')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  method === 'VIETQR'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/80 border border-transparent'
                }`}
              >
                <Building className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">VietQR Ngân hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('MOMO')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  method === 'MOMO'
                    ? 'bg-[#A50064] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/80 border border-transparent'
                }`}
              >
                <Smartphone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Ví MoMo</span>
              </button>
            </div>

            {/* ĐỐI VỚI VÍ MOMO: BỔ SUNG THÔNG TIN CHUẨN QR */}
            {method === 'MOMO' && (
              <div className="flex items-center justify-between text-[11px] bg-pink-50/70 border border-pink-100 px-3 py-1.5 rounded-xl">
                <span className="text-pink-900 font-semibold">Định dạng mã:</span>
                <span className="text-[10px] font-black uppercase text-pink-700 bg-pink-100/90 px-2 py-0.5 rounded-md">
                  Mã Chuẩn VietQR Napas 247
                </span>
              </div>
            )}

            {/* HÌNH ẢNH MÃ QR TỰ ĐỘNG & THÔNG TIN COPY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* KHỐI QR */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-w-[240px] w-full mx-auto">
                <div className="w-full aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQrUrl}
                    alt="Mã QR thanh toán"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* NÚT THAO TÁC TRỰC TIẾP TRÊN MOBILE CHO MOMO */}
                {method === 'MOMO' ? (
                  <button
                    type="button"
                    onClick={handleOpenMoMoApp}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#A50064] py-2 px-3 text-xs font-black text-white shadow-xs hover:bg-[#8e0056] active:scale-98 transition"
                    title="Bấm để mở ứng dụng MoMo và tự điền thông tin"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Mở ứng dụng MoMo</span>
                  </button>
                ) : null}

                {/* NÚT LƯU ẢNH QR VÀO MÁY */}
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 px-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span>{isDownloading ? 'Đang tải ảnh...' : 'Lưu ảnh QR vào máy'}</span>
                </button>

                <span className="mt-1.5 text-[10px] text-slate-500 text-center leading-tight">
                  Quét bằng <strong>App {method === 'VIETQR' ? 'Ngân hàng' : 'MoMo'}</strong>
                </span>
              </div>

              {/* KHỐI THẺ CHI TIẾT DẠNG TO RÕ VỚI NÚT SAO CHÉP MỘT CHẠM */}
              <div className="space-y-2 text-xs">
                {method === 'VIETQR' ? (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Ngân hàng nhận
                        </span>
                        <strong className="text-slate-900 font-bold text-xs">{bankId} ({bankName})</strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Số tài khoản
                        </span>
                        <strong className="text-slate-900 font-mono font-black text-sm tracking-wide">
                          {accountNumber}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(accountNumber, 'acc')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition ${
                          copiedField === 'acc'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:text-amber-600'
                        }`}
                      >
                        {copiedField === 'acc' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Chủ tài khoản
                      </span>
                      <strong className="text-slate-900 font-bold uppercase text-xs block truncate">
                        {accountHolder}
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-200 space-y-1">
                      <span className="text-[10px] text-pink-700 font-bold block uppercase tracking-wider">
                        Ví Điện Tử MoMo
                      </span>
                      <strong className="text-slate-900 font-bold text-xs block">
                        Mã Chuẩn VietQR Napas 247
                      </strong>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                        Mở App MoMo hoặc ứng dụng ngân hàng bất kỳ để quét mã QR và chuyển tiền cọc.
                      </p>
                    </div>
                  </>
                )}

                {/* THẺ SỐ TIỀN CỌC CẦN CHUYỂN */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">
                      Số tiền cọc cần chuyển
                    </span>
                    <strong className="text-amber-950 font-black text-sm sm:text-base">
                      {formatVND(depositAmount)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(depositAmount), 'amount')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition ${
                      copiedField === 'amount'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {copiedField === 'amount' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* THẺ CÚ PHÁP CHUYỂN KHOẢN BẮT BUỘC */}
                <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                      Cú pháp bắt buộc
                    </span>
                    <strong className="font-mono text-amber-300 font-black text-xs sm:text-sm">
                      {transferContent}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, 'content')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition ${
                      copiedField === 'content'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                        : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {copiedField === 'content' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* HƯỚNG DẪN XỬ LÝ LỖI "NGƯỜI DÙNG CHƯA ĐĂNG KÝ" CHO MOMO */}
            {method === 'MOMO' && (
              <div className="rounded-2xl border border-pink-200 bg-pink-50/60 p-3 text-[11px] text-pink-950 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-pink-900">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[#A50064] shrink-0" />
                    <span>Lưu ý khi thanh toán qua Ví MoMo:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                    className="text-[#A50064] hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{showTroubleshoot ? 'Thu gọn' : 'Báo lỗi quét mã?'}</span>
                  </button>
                </div>

                <p className="text-slate-600 leading-snug">
                  Đảm bảo ứng dụng MoMo đang quét đúng số điện thoại <strong className="font-mono text-slate-900">{momoPhone}</strong>.
                  Người dùng trên điện thoại có thể nhấn nút <strong className="text-[#A50064]">Mở ứng dụng MoMo</strong> phía trên để chuyển tiền tức thì.
                </p>

                {showTroubleshoot && (
                  <div className="mt-2 pt-2 border-t border-pink-200/80 space-y-1 text-slate-700 text-[10px] leading-relaxed">
                    <p className="font-bold text-slate-900">Nếu App MoMo thông báo &quot;Người dùng chưa đăng ký&quot;:</p>
                    <p>1. <strong>Môi trường:</strong> Nếu đang ở tài khoản Test/Sandbox, chỉ App MoMo Developer mới quét được. App thông thường từ App Store sẽ báo lỗi này.</p>
                    <p>2. <strong>Chuyển tiền thủ công:</strong> Mở MoMo chọn mục <em>&quot;Chuyển tiền đến ví MoMo&quot;</em> ➔ Nhập SĐT <strong className="font-mono text-slate-900">{momoPhone}</strong> ➔ Nhập số tiền <strong className="text-slate-900">{formatVND(depositAmount)}</strong> ➔ Lời nhắn <strong className="font-mono text-slate-900">{transferContent}</strong>.</p>
                    <p>3. <strong>Phương thức thay thế:</strong> Chuyển sang tab <strong>VietQR Ngân hàng</strong> ở trên để thanh toán qua bất kỳ App ngân hàng nào.</p>
                  </div>
                )}
              </div>
            )}

            {/* LƯU Ý CÚ PHÁP VIETQR */}
            {method === 'VIETQR' && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Giữ nguyên cú pháp <code className="font-bold text-slate-950 font-mono">{transferContent}</code> để hệ thống đối soát tự động kích hoạt bảo lưu máy ngay tức thì.
                </span>
              </div>
            )}

            {/* NÚT HOÀN TẤT */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 active:scale-98 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Tôi đã hoàn tất chuyển khoản</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Đóng hộp thoại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
