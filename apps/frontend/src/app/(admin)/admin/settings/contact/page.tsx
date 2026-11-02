'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  Eye,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function AdminContactSettingsPage() {
  const { token } = useAuth();

  // Form State
  const [hotline, setHotline] = useState('0976 619 044');
  const [zaloPhone, setZaloPhone] = useState('0976619044');
  const [facebookUrl, setFacebookUrl] = useState('https://facebook.com/congnguyenmachinery');
  const [emailContact, setEmailContact] = useState('hotro@congnguyen.com.vn');
  const [showroomAddress, setShowroomAddress] = useState('6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam');

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    // Tải cấu hình hiện tại từ backend (vô hiệu hóa cache)
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/contact`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          if (cfg.hotline !== undefined && cfg.hotline !== null) setHotline(cfg.hotline);
          if (cfg.zaloPhone !== undefined && cfg.zaloPhone !== null) setZaloPhone(cfg.zaloPhone);
          if (cfg.facebookUrl !== undefined && cfg.facebookUrl !== null) setFacebookUrl(cfg.facebookUrl);
          if (cfg.emailContact !== undefined && cfg.emailContact !== null) setEmailContact(cfg.emailContact);
          if (cfg.showroomAddress !== undefined && cfg.showroomAddress !== null) {
            setShowroomAddress(cfg.showroomAddress);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend chưa khởi động hoặc dùng cấu hình mặc định:', err);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      hotline: hotline.trim(),
      zaloPhone: zaloPhone.trim(),
      facebookUrl: facebookUrl.trim(),
      emailContact: emailContact.trim(),
      showroomAddress: showroomAddress.trim(),
    };

    console.log('[AdminContactSettingsPage] Submitting Contact Settings:', payload);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/contact', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log('[AdminContactSettingsPage] Backend Response:', json);

      if (res.ok && (json.success !== false)) {
        showToast('Cập nhật thông tin liên hệ thành công!', 'success');
        if (json.data) {
          const updated = json.data;
          if (updated.hotline) setHotline(updated.hotline);
          if (updated.zaloPhone) setZaloPhone(updated.zaloPhone);
          if (updated.facebookUrl) setFacebookUrl(updated.facebookUrl);
          if (updated.emailContact) setEmailContact(updated.emailContact);
          if (updated.showroomAddress) setShowroomAddress(updated.showroomAddress);
        }
      } else {
        const errMsg = json.error?.message || json.message || 'Lỗi khi lưu thông tin liên hệ (Mã lỗi: ' + res.status + ')';
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      console.error('[AdminContactSettingsPage] Network Error:', err);
      showToast(err.message || 'Không thể kết nối đến máy chủ backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestHotline = () => {
    window.open(`tel:${hotline.replace(/\s+/g, '')}`);
  };

  const handleTestZalo = () => {
    const cleanZalo = zaloPhone.replace(/\D/g, '');
    window.open(`https://zalo.me/${cleanZalo}`, '_blank');
  };

  const handleTestFacebook = () => {
    window.open(facebookUrl, '_blank');
  };

  const handleTestEmail = () => {
    window.open(`mailto:${emailContact}`);
  };

  const handleTestAddress = () => {
    window.open(
      'https://www.google.com/maps/dir/?api=1&destination=6%2F3+DN4%2C+%C4%90%C3%B4ng+H%C6%B0ng+Thu%E1%BA%ADn%2C+H%E1%BB%93+Ch%C3%AD+Minh%2C+Vi%E1%BB%87t+Nam&travelmode=two-wheeler',
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-amber-600" />
            Cài Đặt Thông Tin Liên Hệ & Kênh Tương Tác
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình số điện thoại hotline, tài khoản Zalo, Fanpage Facebook, email tiếp nhận báo giá và địa chỉ kho xưởng hiển thị trên toàn bộ Storefront.
          </p>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toastMsg && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* CỘT TRÁI: FORM CÀI ĐẶT (7 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. SỐ ĐIỆN THOẠI HOTLINE */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Số điện thoại Hotline B2B (Gọi trực tiếp) *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kích hoạt hành động gọi ngay <code className="text-slate-700">tel:</code> khi khách hàng bấm trên website.
              </p>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                  <input
                    type="text"
                    required
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    placeholder="VD: 0976 619 044"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestHotline}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-amber-700 transition"
                  title="Thử gọi điện"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Thử gọi</span>
                </button>
              </div>
            </div>

            {/* 2. SỐ ĐIỆN THOẠI ZALO */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Số điện thoại Zalo tư vấn kỹ thuật *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hệ thống tự động liên kết tới link: <code className="text-blue-700">https://zalo.me/{zaloPhone.replace(/\D/g, '')}</code>
              </p>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[9px]">
                    Z
                  </div>
                  <input
                    type="text"
                    required
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    placeholder="VD: 0976619044"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestZalo}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                  title="Mở Zalo"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở Zalo</span>
                </button>
              </div>
            </div>

            {/* 3. FACEBOOK FANPAGE / MESSENGER */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Đường dẫn Facebook Fanpage / Messenger *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Link Fanpage hoặc link chat trực tiếp m.me để khách hàng gửi ảnh máy cũ cần bán.
              </p>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[9px]">
                    f
                  </div>
                  <input
                    type="url"
                    required
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="VD: https://facebook.com/congnguyenmachinery"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestFacebook}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                  title="Mở Facebook"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở FB</span>
                </button>
              </div>
            </div>

            {/* 4. EMAIL TIẾP NHẬN THÔNG TIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Email tiếp nhận hồ sơ báo giá (RFQ) *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kích hoạt hành động gửi mail <code className="text-slate-700">mailto:</code> khi khách nhấn vào liên hệ.
              </p>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <input
                    type="email"
                    required
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    placeholder="VD: hotro@congnguyen.com.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition"
                  title="Gửi email"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Gửi Mail</span>
                </button>
              </div>
            </div>

            {/* 5. ĐỊA CHỈ KHO XƯỞNG / SHOWROOM */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Địa chỉ Kho xưởng máy & Showroom trưng bày *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Địa điểm để khách hàng mang bột đến test thử trực tiếp và nhận bàn giao máy.
              </p>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                  <input
                    type="text"
                    required
                    value={showroomAddress}
                    onChange={(e) => setShowroomAddress(e.target.value)}
                    placeholder="VD: Hồ Chí Minh, Việt Nam"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:border-red-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestAddress}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-red-700 transition"
                  title="Xem bản đồ"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Xem Bản đồ</span>
                </button>
              </div>
            </div>

            {/* NÚT LƯU CÀI ĐẶT */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 active:scale-98 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Đang cập nhật hệ thống...' : 'Lưu Cài Đặt Thông Tin Liên Hệ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* CỘT PHẢI: XEM TRƯỚC BỘ NÚT NỔI & FOOTER (5 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* PREVIEW FLOATING WIDGET */}
          <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Xem Trước: Floating Contact Widget
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                Trực tiếp
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-6">
              Bộ nút nổi xuất hiện ở góc dưới bên phải màn hình khách hàng để liên hệ 1-chạm:
            </p>

            {/* MÔ PHỎNG NÚT NỔI TRÊN STOREFRONT */}
            <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 w-fit ml-auto">
              {/* Nút 1: Hotline */}
              <div
                className="h-10 w-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40 animate-pulse hover:scale-110 transition-transform cursor-pointer"
                title={`Gọi: ${hotline}`}
              >
                <Phone className="h-4 w-4 fill-current" />
              </div>

              {/* Nút 2: Zalo */}
              <div
                className="h-10 w-10 rounded-full bg-[#0068FF] text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40 hover:scale-110 transition-transform cursor-pointer"
                title={`Zalo: ${zaloPhone}`}
              >
                Zalo
              </div>

              {/* Nút 3: Facebook Messenger */}
              <div
                className="h-10 w-10 rounded-full bg-[#0084FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40 hover:scale-110 transition-transform cursor-pointer"
                title="Messenger"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.517 3.735 7.185v3.557c0 .488.54.78.94.502l3.414-2.37c.616.145 1.256.223 1.911.223 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.55-2.72-4.978 2.72 5.474-5.811 2.614 2.72 4.914-2.72-5.474 5.811z" />
                </svg>
              </div>

              {/* Nút 4: Email */}
              <div
                className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/40 hover:scale-110 transition-transform cursor-pointer"
                title={`Email: ${emailContact}`}
              >
                <Mail className="h-4 w-4 text-white" />
              </div>

              {/* Nút 5: Toggle */}
              <div
                className="h-9 w-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 shadow-md"
              >
                <X className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* PREVIEW FOOTER SECTION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Dữ liệu hiển thị tại chân trang (Footer):</span>
            </div>

            <div className="space-y-2.5 text-slate-600">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Hotline Kỹ Thuật 24/7:</span>
                  <strong className="text-slate-900 font-bold">{hotline}</strong>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Email tiếp nhận báo giá:</span>
                  <strong className="text-slate-900 font-bold">{emailContact}</strong>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Xưởng máy & Showroom:</span>
                  <strong className="text-slate-900 font-bold">{showroomAddress}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
