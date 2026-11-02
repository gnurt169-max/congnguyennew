'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Phone,
  Mail,
  X,
  Headphones,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

interface ContactSettingsData {
  hotline: string;
  zaloPhone: string;
  facebookUrl: string;
  emailContact: string;
  showroomAddress?: string | null;
}

const DEFAULT_SETTINGS: ContactSettingsData = {
  hotline: '0976 619 044',
  zaloPhone: '0976619044',
  facebookUrl: 'https://facebook.com/congnguyenmachinery',
  emailContact: 'hotro@congnguyen.com.vn',
  showroomAddress: '6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam',
};

export function FloatingContactWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [settings, setSettings] = useState<ContactSettingsData>(DEFAULT_SETTINGS);

  // Hook useEffect được gọi vô điều kiện ở đầu component tuân thủ Rules of Hooks
  useEffect(() => {
    // Tải thông tin liên hệ từ API công khai
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/settings/contact`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          setSettings({
            hotline: cfg.hotline || DEFAULT_SETTINGS.hotline,
            zaloPhone: cfg.zaloPhone || DEFAULT_SETTINGS.zaloPhone,
            facebookUrl: cfg.facebookUrl || DEFAULT_SETTINGS.facebookUrl,
            emailContact: cfg.emailContact || DEFAULT_SETTINGS.emailContact,
            showroomAddress: cfg.showroomAddress || DEFAULT_SETTINGS.showroomAddress,
          });
        }
      })
      .catch(() => {
        // Fallback dùng giá trị mặc định
      });
  }, []);

  // Không hiển thị trên trang Admin (đặt sau toàn bộ các React Hooks)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const cleanHotline = settings.hotline.replace(/\s+/g, '');
  const cleanZalo = settings.zaloPhone.replace(/\D/g, '');

  return (
    <div
      className="fixed bottom-24 right-4 sm:bottom-24 sm:right-6 z-30 flex flex-col items-center gap-3 select-none"
      aria-label="Kênh liên hệ nhanh"
    >
      {/* CỘT CÁC NÚT TRÒN (TÍNH TỪ TRÊN XUỐNG DƯỚI) */}
      {isOpen && (
        <div className="flex flex-col items-center gap-3 transition-all duration-300 animate-slide-up">
          {/* NÚT 1: HOTLINE (Phone icon màu trắng tinh, nền xanh lá emerald nổi bật, có Radar ping và Tooltip cao cấp) */}
          <a
            href={`tel:${cleanHotline}`}
            className="group relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/30 transition-transform duration-200 hover:scale-110 active:scale-95 animate-phone-ring"
            title={`Gọi Hotline: ${settings.hotline}`}
            aria-label={`Gọi Hotline: ${settings.hotline}`}
          >
            {/* Hiệu ứng sóng lan tỏa radar nhấp nháy */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pointer-events-none" />

            {/* Icon điện thoại trắng tinh tâm nút tròn */}
            <Phone className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 text-white stroke-[2.2] fill-white/20 transition-transform duration-200 group-hover:rotate-12" />

            {/* Tooltip hiển thị số hotline bên trái nút */}
            <div className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 z-50">
              <span className="text-slate-300">Gọi Hotline:</span>
              <span className="font-bold text-amber-400 tracking-wide">{settings.hotline}</span>
              {/* Mũi tên tam giác nhỏ trỏ vào nút */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-900/90" />
            </div>
          </a>

          {/* NÚT 2: ZALO (Logo/Chữ Zalo, nền xanh dương bg-[#0068FF], href https://zalo.me/...) */}
          <a
            href={`https://zalo.me/${cleanZalo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#0068FF] hover:bg-[#0057d6] text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-400/30 transition-transform duration-200 hover:scale-110 active:scale-95"
            title={`Chat Zalo: ${settings.zaloPhone}`}
            aria-label={`Chat Zalo: ${settings.zaloPhone}`}
          >
            <span className="font-black text-[13px] tracking-tight leading-none text-white">
              Zalo
            </span>

            {/* Tooltip Zalo */}
            <div className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 z-50">
              <span className="text-slate-300">Chat Zalo:</span>
              <span className="font-bold text-blue-400 tracking-wide">{settings.zaloPhone}</span>
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-900/90" />
            </div>
          </a>

          {/* NÚT 3: FACEBOOK / MESSENGER (Icon chat Messenger, nền bg-[#0084FF], mở link Facebook/Messenger) */}
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#0084FF] hover:bg-[#0073e6] text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-400/30 transition-transform duration-200 hover:scale-110 active:scale-95"
            title="Nhắn tin qua Facebook Messenger"
            aria-label="Facebook Messenger"
          >
            <svg
              className="h-6 w-6 fill-white"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.517 3.735 7.185v3.557c0 .488.54.78.94.502l3.414-2.37c.616.145 1.256.223 1.911.223 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.55-2.72-4.978 2.72 5.474-5.811 2.614 2.72 4.914-2.72-5.474 5.811z" />
            </svg>

            {/* Tooltip Messenger */}
            <div className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 z-50">
              <span className="text-slate-300">Messenger:</span>
              <span className="font-bold text-sky-400 tracking-wide">Công Nguyên</span>
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-900/90" />
            </div>
          </a>

          {/* NÚT 4: EMAIL (Icon thư Mail, nền đỏ bg-rose-500, href mailto:...) */}
          <a
            href={`mailto:${settings.emailContact}`}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-400/30 transition-transform duration-200 hover:scale-110 active:scale-95"
            title={`Gửi email: ${settings.emailContact}`}
            aria-label={`Gửi email: ${settings.emailContact}`}
          >
            <Mail className="h-5 w-5 text-white stroke-[2.2]" />

            {/* Tooltip Email */}
            <div className="pointer-events-none absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 z-50">
              <span className="text-slate-300">Email:</span>
              <span className="font-bold text-rose-300 tracking-wide">{settings.emailContact}</span>
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-slate-900/90" />
            </div>
          </a>
        </div>
      )}

      {/* NÚT 5: ĐÓNG / MỞ (X) Ở DƯỚI CÙNG */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-slate-200 shadow-md border border-slate-700 hover:bg-slate-800 hover:text-white transition-transform duration-200 hover:scale-110 active:scale-95"
        aria-label={isOpen ? 'Thu gọn nút liên hệ' : 'Mở rộng kênh liên hệ'}
        title={isOpen ? 'Thu gọn' : 'Kênh liên hệ nhanh'}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative">
            <Headphones className="h-5 w-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
