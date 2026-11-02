'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

interface ContactSettingsData {
  hotline: string;
  zaloPhone: string;
  facebookUrl: string;
  emailContact: string;
  showroomAddress?: string | null;
}

interface FeaturedLinkItem {
  label: string;
  url: string;
}

interface SiteContentData {
  footerCompanyName: string;
  footerSlogan: string;
  footerDescription: string;
  footerCopyright: string;
  featuredLinks: FeaturedLinkItem[];
}

const DEFAULT_CONTACT: ContactSettingsData = {
  hotline: '0976 619 044',
  zaloPhone: '0976619044',
  facebookUrl: 'https://facebook.com/congnguyenmachinery',
  emailContact: 'admin@congnguyen.com.vn',
  showroomAddress: '6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam',
};

const REAL_BAKERY_LINKS: FeaturedLinkItem[] = [
  {
    label: 'Tủ trưng bày bánh kem & Bảo quản',
    url: '/products?categorySlug=tu-trung-bay-banh',
  },
  {
    label: 'Lò nướng bánh công nghiệp',
    url: '/products?categorySlug=lo-nuong-cong-nghiep',
  },
  {
    label: 'Máy trộn bột & Cối đánh trứng',
    url: '/products?categorySlug=may-tron-bot-danh-trung',
  },
  {
    label: 'Dịch vụ Thu mua máy làm bánh cũ',
    url: '/thu-mua-may-cu',
  },
  {
    label: 'Tra cứu tiến độ kỹ thuật & Đơn hàng',
    url: '/tra-cuu-tien-do',
  },
];

const DEFAULT_CONTENT: SiteContentData = {
  footerCompanyName: 'CÔNG NGUYÊN',
  footerSlogan: 'THIẾT BỊ BÁNH THANH LÝ & TÂN TRANG',
  footerDescription:
    'Công Nguyên chuyên thu mua, tân trang và thanh lý thiết bị làm bánh công nghiệp chất lượng cao tại TP.HCM. Cam kết máy móc nguyên bản, kỹ thuật kiểm định chuẩn xưởng, bảo hành tận tâm và giá thành tối ưu cho chủ tiệm bánh.',
  footerCopyright:
    '© 2026 CÔNG NGUYÊN - congnguyen.com.vn. Thiết bị làm bánh thanh lý & tân trang hàng đầu TP.HCM.',
  featuredLinks: REAL_BAKERY_LINKS,
};

export function MainFooter() {
  const pathname = usePathname();
  const [contact, setContact] = useState<ContactSettingsData>(DEFAULT_CONTACT);
  const [content, setContent] = useState<SiteContentData>(DEFAULT_CONTENT);
  const [brandLogoText, setBrandLogoText] = useState('CN');

  // Hook useEffect được gọi vô điều kiện ở đầu component tuân thủ Rules of Hooks
  useEffect(() => {
    const baseUrl = getApiBaseUrl();

    // 0. Lấy thông tin nhận diện thương hiệu động (Brand Identity)
    fetch(`${baseUrl}/settings/general`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          if (cfg.brandLogoText) setBrandLogoText(cfg.brandLogoText);
          if (cfg.brandName || cfg.brandTagline) {
            setContent((prev) => ({
              ...prev,
              ...(cfg.brandName && { footerCompanyName: cfg.brandName }),
              ...(cfg.brandTagline && { footerSlogan: cfg.brandTagline }),
            }));
          }
        }
      })
      .catch(() => {});

    // 1. Lấy thông tin liên hệ động từ backend
    fetch(`${baseUrl}/settings/contact`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          setContact({
            hotline: cfg.hotline || DEFAULT_CONTACT.hotline,
            zaloPhone: cfg.zaloPhone || DEFAULT_CONTACT.zaloPhone,
            facebookUrl: cfg.facebookUrl || DEFAULT_CONTACT.facebookUrl,
            emailContact: cfg.emailContact || DEFAULT_CONTACT.emailContact,
            showroomAddress: cfg.showroomAddress || DEFAULT_CONTACT.showroomAddress,
          });
        }
      })
      .catch(() => {});

    // 2. Lấy nội dung giới thiệu & bản quyền chân trang động từ backend
    fetch(`${baseUrl}/settings/content`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;

          // Chuẩn hóa tên thương hiệu, xóa bỏ hoàn toàn chữ tiếng Anh 'INDUSTRIAL BAKERY' nếu backend còn lưu
          let sanitizedCompanyName = cfg.footerCompanyName || DEFAULT_CONTENT.footerCompanyName;
          if (sanitizedCompanyName.includes('INDUSTRIAL BAKERY')) {
            sanitizedCompanyName = 'CÔNG NGUYÊN';
          }

          let sanitizedSlogan = cfg.footerSlogan || DEFAULT_CONTENT.footerSlogan;

          let sanitizedDesc = cfg.footerDescription;
          if (
            !sanitizedDesc ||
            sanitizedDesc.includes('dây chuyền sản xuất') ||
            sanitizedDesc.includes('Lò nướng xoay')
          ) {
            sanitizedDesc = DEFAULT_CONTENT.footerDescription;
          }

          let sanitizedCopyright = cfg.footerCopyright;
          if (!sanitizedCopyright || sanitizedCopyright.includes('Bảo lưu toàn bộ bản quyền')) {
            sanitizedCopyright = DEFAULT_CONTENT.footerCopyright;
          }

          // Lọc danh sách liên kết: nếu backend còn lưu các máy ảo cũ (Rotary, Spiral, vi khí hậu...), thay bằng danh mục thực tế
          let links =
            Array.isArray(cfg.featuredLinks) && cfg.featuredLinks.length > 0
              ? cfg.featuredLinks
              : REAL_BAKERY_LINKS;

          const hasMockLinks = links.some(
            (l: FeaturedLinkItem) =>
              l.label.includes('Rotary') ||
              l.label.includes('Spiral') ||
              l.label.includes('vi khí hậu') ||
              l.label.includes('tự động') ||
              l.label.includes('chịu nhiệt'),
          );

          if (hasMockLinks) {
            links = REAL_BAKERY_LINKS;
          }

          setContent({
            footerCompanyName: sanitizedCompanyName,
            footerSlogan: sanitizedSlogan,
            footerDescription: sanitizedDesc,
            footerCopyright: sanitizedCopyright,
            featuredLinks: links,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Không hiển thị Footer trên các trang quản trị Admin (đặt sau toàn bộ các React Hooks)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const cleanHotline = contact.hotline.replace(/\s+/g, '');
  const cleanZalo = contact.zaloPhone.replace(/\D/g, '') || '0976619044';

  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-12 lg:py-16 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 lg:gap-12">
          {/* CỘT 1: GIỚI THIỆU THƯƠNG HIỆU (BÊN TRÁI - 5 COLS) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-lg shadow-md flex-shrink-0">
                {brandLogoText || 'CN'}
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block leading-tight">
                  {content.footerCompanyName}
                </span>
                <span className="text-xs uppercase tracking-wider text-amber-500 font-bold block mt-0.5">
                  {content.footerSlogan}
                </span>
              </div>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              {content.footerDescription}
            </p>

            {/* CỤM NÚT KẾT NỐI MẠNG XÃ HỘI */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`https://zalo.me/${cleanZalo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition-colors"
                title="Chat Zalo với kỹ sư xưởng Công Nguyên"
              >
                <span>Chat Zalo</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={contact.facebookUrl || 'https://facebook.com/congnguyenmachinery'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 shadow-xs hover:bg-slate-700 hover:text-white transition-colors"
                title="Truy cập Fanpage Facebook Công Nguyên"
              >
                <MessageCircle className="h-3.5 w-3.5 text-pink-400" />
                <span>Fanpage Facebook</span>
              </a>
            </div>
          </div>

          {/* CỘT 2: DANH MỤC THIẾT BỊ THỰC TẾ & DỊCH VỤ (CỘT GIỮA - 3 COLS) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              DANH MỤC THIẾT BỊ & DỊCH VỤ
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {content.featuredLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.url || '/products'}
                    className={`transition-colors duration-150 block py-0.5 ${
                      item.url?.includes('thu-mua') || item.url?.includes('thanh-ly')
                        ? 'text-amber-400 font-bold hover:text-amber-300 hover:underline'
                        : item.url?.includes('tra-cuu') || item.url?.includes('tracking')
                        ? 'text-slate-300 font-semibold hover:text-amber-400'
                        : 'text-slate-400 hover:text-amber-400 font-medium'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: THÔNG TIN LIÊN HỆ & KHO XƯỞNG (CỘT PHẢI - 4 COLS) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              THÔNG TIN LIÊN HỆ & ĐỊA CHỈ KHO
            </h4>
            <ul className="mt-4 space-y-3.5 text-sm">
              {/* HOTLINE / ZALO TƯ VẤN */}
              <li>
                <a
                  href={`tel:${cleanHotline}`}
                  className="flex items-start gap-2.5 hover:text-amber-400 transition-colors group"
                  title="Bấm để gọi điện tư vấn trực tiếp"
                >
                  <Phone className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs text-slate-500 block">Hotline / Zalo tư vấn:</span>
                    <strong className="text-white text-base font-black group-hover:text-amber-400">
                      {contact.hotline}
                    </strong>
                  </div>
                </a>
              </li>

              {/* EMAIL TIẾP NHẬN BÁO GIÁ */}
              <li>
                <a
                  href={`mailto:${contact.emailContact || 'admin@congnguyen.com.vn'}`}
                  className="flex items-start gap-2.5 hover:text-emerald-400 transition-colors group"
                  title="Gửi email tiếp nhận báo giá & hồ sơ máy"
                >
                  <Mail className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs text-slate-500 block">Email tiếp nhận báo giá:</span>
                    <strong className="text-slate-200 text-xs font-semibold group-hover:text-emerald-400">
                      {contact.emailContact || 'admin@congnguyen.com.vn'}
                    </strong>
                  </div>
                </a>
              </li>

              {/* WEBSITE CHÍNH THỨC */}
              <li>
                <a
                  href="https://congnguyen.com.vn"
                  className="flex items-start gap-2.5 hover:text-amber-400 transition-colors group"
                  title="Website chính thức Công Nguyên"
                >
                  <Globe className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs text-slate-500 block">Website chính thức:</span>
                    <strong className="text-slate-200 text-xs font-semibold group-hover:text-amber-400">
                      congnguyen.com.vn
                    </strong>
                  </div>
                </a>
              </li>

              {/* KHO XƯỞNG & SHOWROOM KÈM CHỈ ĐƯỜNG XE MÁY */}
              <li>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 block">Kho xưởng & Showroom:</span>
                    <span className="text-slate-300 text-xs leading-snug block font-medium">
                      {contact.showroomAddress && contact.showroomAddress !== 'Hồ Chí Minh, Việt Nam'
                        ? contact.showroomAddress
                        : '6/3 DN4, Đông Hưng Thuận, Hồ Chí Minh, Việt Nam'}
                    </span>
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=6%2F3+DN4%2C+%C4%90%C3%B4ng+H%C6%B0ng+Thu%E1%BA%ADn%2C+H%E1%BB%93+Ch%C3%AD+Minh%2C+Vi%E1%BB%87t+Nam&travelmode=two-wheeler"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-slate-750 hover:text-amber-300 hover:border-amber-500/50 transition-all group"
                      title="Chỉ đường xe máy qua Google Maps tới xưởng Công Nguyên"
                    >
                      <span>🏍️ Chỉ đường xe máy (Google Maps)</span>
                      <ExternalLink className="h-3 w-3 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. DÒNG BẢN QUYỀN DƯỚI ĐÁY (BOTTOM COPYRIGHT BAR) */}
        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          {content.footerCopyright}
        </div>
      </div>
    </footer>
  );
}
