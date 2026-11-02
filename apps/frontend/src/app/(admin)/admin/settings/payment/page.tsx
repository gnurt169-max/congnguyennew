'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { normalizeImagePath, getApiBaseUrl } from '@/lib/utils';
import {
  QrCode,
  Building,
  Smartphone,
  Save,
  CheckCircle2,
  Eye,
  AlertCircle,
  Loader2,
  UploadCloud,
  Trash2,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function AdminPaymentSettingsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state - Cố định duy nhất TPBank
  const bankId = 'TPB';
  const bankName = 'TPBank (Ngân hàng Tiên Phong)';
  const [accountNumber, setAccountNumber] = useState('1029384756');
  const [isBankEnabled, setIsBankEnabled] = useState(true);

  // MoMo state - Sử dụng ảnh QR tĩnh định dạng WebP đã tải lên
  const [momoQrUrl, setMomoQrUrl] = useState<string>('/uploads/payment/momo-qr.webp');
  const [isMomoEnabled, setIsMomoEnabled] = useState(true);
  const [isUploadingMomo, setIsUploadingMomo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Tab xem trước (Tab 1: VietQR, Tab 2: MoMo)
  const [previewTab, setPreviewTab] = useState<'VIETQR' | 'MOMO'>('VIETQR');

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    // Tải cấu hình thanh toán từ backend (vô hiệu hóa cache)
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/payment/config`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.data) {
          const cfg = res.data;
          if (cfg.accountNumber) setAccountNumber(cfg.accountNumber);
          if (cfg.isBankEnabled !== undefined) setIsBankEnabled(cfg.isBankEnabled);
          if (cfg.momoQrUrl) setMomoQrUrl(cfg.momoQrUrl.replace('.png', '.webp'));
          if (cfg.isMomoEnabled !== undefined) setIsMomoEnabled(cfg.isMomoEnabled);
        }
      })
      .catch((err) => {
        console.warn('Backend chưa sẵn sàng hoặc dùng cấu hình mặc định:', err);
      });
  }, []);

  // Xử lý upload file ảnh QR MoMo (Backend tự động convert WebP qua Sharp)
  const handleUploadMomoQr = async (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Định dạng ảnh không hợp lệ. Vui lòng tải lên JPG, PNG hoặc WEBP.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa cho phép là 10MB.', 'error');
      return;
    }

    setIsUploadingMomo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAdminAuth('/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || (!json.data?.url && !json.url)) {
        throw new Error(json.error?.message || json.message || 'Tải ảnh lên thất bại');
      }

      const uploadedUrl = json.data?.url || json.url;
      setMomoQrUrl(uploadedUrl);
      showToast('Đã tải lên và tối ưu ảnh mã QR MoMo (.webp) thành công! Nhấn "Lưu cấu hình" để hoàn tất.', 'success');
    } catch (err: any) {
      console.error('[AdminPaymentSettings] Upload QR error:', err);
      showToast(err.message || 'Lỗi khi tải ảnh lên máy chủ', 'error');
    } finally {
      setIsUploadingMomo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadMomoQr(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadMomoQr(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const payload = {
      bankId: 'TPB',
      bankName: 'TPBank (Ngân hàng Tiên Phong)',
      accountNumber: accountNumber.trim(),
      isBankEnabled,
      momoQrUrl: momoQrUrl ? momoQrUrl.trim() : null,
      isMomoEnabled,
    };

    console.log('[AdminPaymentSettingsPage] Submitting Payment Settings:', payload);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/payment', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log('[AdminPaymentSettingsPage] Backend Response:', json);

      if (res.ok && json.success !== false) {
        showToast('Cập nhật cấu hình thanh toán thành công!', 'success');
        if (json.data) {
          const updated = json.data;
          if (updated.accountNumber) setAccountNumber(updated.accountNumber);
          if (updated.isBankEnabled !== undefined) setIsBankEnabled(updated.isBankEnabled);
          if (updated.momoQrUrl) setMomoQrUrl(updated.momoQrUrl);
          if (updated.isMomoEnabled !== undefined) setIsMomoEnabled(updated.isMomoEnabled);
        }
      } else {
        const errMsg = json.error?.message || json.message || `Lỗi khi lưu cấu hình thanh toán (Mã lỗi: ${res.status})`;
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      console.error('[AdminPaymentSettingsPage] Network Error:', err);
      showToast(err.message || 'Không thể kết nối đến máy chủ backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  // URL tạo ảnh VietQR (cố định TPBank TPB)
  const testAmount = 15000000;
  const testOrderCode = 'DH202610001';
  const previewVietQrUrl = `https://img.vietqr.io/image/TPB-${accountNumber.trim()}-compact2.png?amount=${testAmount}&addInfo=${testOrderCode}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <QrCode className="h-6 w-6 text-amber-600" />
            Cấu hình Thanh toán VietQR & Ví MoMo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cố định nhận tiền cọc máy qua VietQR TPBank và tải lên mã QR ví MoMo tĩnh của doanh nghiệp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={loading || isUploadingMomo}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-sm hover:bg-amber-400 active:scale-98 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{loading ? 'Đang lưu...' : 'Lưu cấu hình thanh toán'}</span>
        </button>
      </div>

      {toastMsg && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: FORM CÀI ĐẶT (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* KHỐI 1: TÀI KHOẢN NGÂN HÀNG VIETQR (CỐ ĐỊNH TPBANK) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Tài khoản Ngân hàng (Chuẩn VietQR TPBank)
                  </h2>
                  <p className="text-[11px] text-slate-500">Cố định duy nhất ngân hàng TPBank</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBankEnabled}
                  onChange={(e) => setIsBankEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-600">
                  {isBankEnabled ? 'Đang bật' : 'Tắt'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              {/* THÔNG TIN NGÂN HÀNG THỤ HƯỞNG CỐ ĐỊNH READ-ONLY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ngân hàng thụ hưởng</label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-xs">
                      TPB
                    </div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>TPBank - Ngân hàng Tiên Phong</span>
                      <Lock className="h-3 w-3 text-slate-400" />
                    </div>
                  </div>
                  <span className="rounded-lg bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5">
                    Mặc định
                  </span>
                </div>
              </div>

              {/* Ô NHẬP LIỆU: SỐ TÀI KHOẢN NHẬN TIỀN */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Số tài khoản nhận tiền <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                    placeholder="VD: 1029384756"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Nhập số tài khoản TPBank nhận tiền cọc. Mã QR thanh toán sẽ tự động liên kết với số này.
                </p>
              </div>
            </div>
          </div>

          {/* KHỐI 2: VÍ ĐIỆN TỬ MOMO (UPLOAD ẢNH MÃ QR TĨNH) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-50 text-[#A50064]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Ví điện tử MoMo
                  </h2>
                  <p className="text-[11px] text-slate-500">Tải lên ảnh mã QR nhận tiền MoMo tĩnh (Tự động chuẩn hóa WebP)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMomoEnabled}
                  onChange={(e) => setIsMomoEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A50064]"></div>
                <span className="ml-2 text-xs font-semibold text-slate-600">
                  {isMomoEnabled ? 'Đang bật' : 'Tắt'}
                </span>
              </label>
            </div>

            {/* VÙNG TẢI LÊN ẢNH MÃ QR MOMO */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Tải lên ảnh Mã QR MoMo
              </label>

              {/* INPUT FILE ẨN */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {momoQrUrl ? (
                /* ĐÃ CÓ ẢNH QR: HIỂN THỊ PREVIEW VÀ CÁC NÚT THAO TÁC */
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-pink-50/50 border border-pink-200">
                  <div className="w-32 h-32 aspect-square rounded-xl bg-white border border-pink-200 p-2 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={normalizeImagePath(momoQrUrl, '/uploads/payment/momo-qr.webp')}
                      alt="Mã QR MoMo đã tải lên"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 text-[#A50064] px-2.5 py-0.5 text-[11px] font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã tải lên mã QR MoMo (.webp)
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 font-mono">
                      {momoQrUrl}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Khách hàng chọn MoMo sẽ quét trực tiếp mã QR này khi đặt cọc đơn hàng.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingMomo}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-pink-600 transition shadow-xs cursor-pointer"
                      >
                        {isUploadingMomo ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>Thay đổi ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMomoQrUrl('')}
                        disabled={isUploadingMomo}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition shadow-xs cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa ảnh</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CHƯA CÓ ẢNH QR: HIỂN THỊ DROPZONE KÉO THẢ HOẶC CHỌN FILE */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-slate-300 hover:border-pink-400 hover:bg-pink-50/30 bg-slate-50/50'
                  }`}
                >
                  {isUploadingMomo ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="h-8 w-8 text-[#A50064] animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Đang nén WebP và tải ảnh mã QR lên hệ thống...</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-2xl bg-pink-100 text-[#A50064] flex items-center justify-center">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">
                          Kéo thả ảnh mã QR MoMo vào đây hoặc <span className="text-[#A50064] underline">chọn từ máy tính</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Hỗ trợ định dạng JPG, PNG, WEBP (Tự động chuyển đổi sang .webp tối ưu)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: XEM TRƯỚC MÃ QR TRỰC TIẾP (LIVE PREVIEW) (5 COLS - TỐI GIẢN CHỈ GIỮ TAB VÀ ẢNH QR) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                Xem trước trực tiếp (Live Preview)
              </span>
              <span className="text-[10px] text-slate-400">Tự động cập nhật</span>
            </div>

            {/* THANH CHUYỂN ĐỔI 2 TAB: [VIETQR (TPBANK)] VÀ [VÍ MOMO] */}
            <div className="flex gap-2 p-1 bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewTab('VIETQR')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  previewTab === 'VIETQR'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>VietQR (TPBank)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('MOMO')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  previewTab === 'MOMO'
                    ? 'bg-[#A50064] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Ví MoMo</span>
              </button>
            </div>

            {/* KHUNG HIỂN THỊ HÌNH ẢNH MÃ QR NẰM CHÍNH GIỮA (VUÔNG VẮN, TRỰC QUAN) */}
            <div className="bg-white rounded-2xl p-5 flex items-center justify-center shadow-inner">
              {previewTab === 'VIETQR' ? (
                /* TAB 1: VIETQR NGÂN HÀNG TPBANK */
                <div className="w-56 h-56 sm:w-64 sm:h-64 aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewVietQrUrl}
                    alt="VietQR TPBank Live Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                /* TAB 2: VÍ MOMO */
                <div className="w-56 h-56 sm:w-64 sm:h-64 aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-200">
                  {momoQrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={normalizeImagePath(momoQrUrl, '/uploads/payment/momo-qr.webp')}
                      alt="MoMo Live Preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400 space-y-2">
                      <AlertCircle className="h-10 w-10 mx-auto text-amber-500" />
                      <p className="text-xs font-bold text-slate-700">Chưa tải lên mã QR MoMo</p>
                      <p className="text-[11px] text-slate-400">Vui lòng tải ảnh mã QR lên ở cột bên trái</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
