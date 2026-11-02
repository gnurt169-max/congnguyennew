'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import {
  ShoppingCart,
  ChevronDown,
  LogOut,
  FileSpreadsheet,
  ShieldCheck,
  Menu,
  X,
  Phone,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

export interface NavigationMenuItem {
  id: string;
  label: string;
  title?: string;
  url: string;
  badge?: string | null;
  order: number;
  isVisible?: boolean;
  isActive?: boolean;
  isOpenNewTab?: boolean;
}

const DEFAULT_NAVIGATION_ITEMS: NavigationMenuItem[] = [
  {
    id: 'menu_inventory',
    label: 'Kho máy thanh lý & tân trang',
    title: 'Kho máy thanh lý & tân trang',
    url: '/products',
    badge: null,
    order: 1,
    isVisible: true,
  },
  {
    id: 'menu_buyback',
    label: 'Thu mua máy cũ',
    title: 'Thu mua máy cũ',
    url: '/thanh-ly',
    badge: 'HOT',
    order: 2,
    isVisible: true,
  },
  {
    id: 'menu_tracking',
    label: 'Tra cứu tiến độ',
    title: 'Tra cứu tiến độ',
    url: '/tracking',
    badge: null,
    order: 3,
    isVisible: true,
  },
];

export interface MainHeaderProps {
  initialItems?: NavigationMenuItem[];
}

export function MainHeader({ initialItems }: MainHeaderProps = {}) {
  const pathname = usePathname();
  const { totalCount, setIsCartDrawerOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [hotline, setHotline] = useState('0976 619 044');
  const [brandName, setBrandName] = useState('CÔNG NGUYÊN');
  const [brandTagline, setBrandTagline] = useState('Giải Pháp Máy Làm Bánh Công Nghiệp');
  const [brandLogoText, setBrandLogoText] = useState('CN');
  const [navItems, setNavItems] = useState<NavigationMenuItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : DEFAULT_NAVIGATION_ITEMS
  );

  useEffect(() => {
    const baseUrl = getApiBaseUrl();

    // Tải thông tin liên hệ
    fetch(`${baseUrl}/settings/contact`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.hotline) setHotline(data.hotline);
        else if (data && data.data && data.data.hotline) setHotline(data.data.hotline);
      })
      .catch(() => {});

    // Tải thông tin nhận diện thương hiệu động
    fetch(`${baseUrl}/settings/general`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const cfg = data.data || data;
          if (cfg.brandName) setBrandName(cfg.brandName);
          if (cfg.brandTagline) setBrandTagline(cfg.brandTagline);
          if (cfg.brandLogoText) setBrandLogoText(cfg.brandLogoText);
        }
      })
      .catch(() => {});

    // Tải danh sách menu điều hướng động từ backend
    const loadNavigation = () => {
      fetch(`${baseUrl}/settings/navigation`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const items = data?.data?.items || data?.items || data?.data;
          if (Array.isArray(items) && items.length > 0) {
            setNavItems(items);
          }
        })
        .catch(() => {});
    };

    loadNavigation();

    // Lắng nghe sự kiện cập nhật menu thời gian thực từ trang Admin
    const handleNavUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNavItems(e.detail);
      } else {
        loadNavigation();
      }
    };

    window.addEventListener('navigation-updated', handleNavUpdate);
    return () => {
      window.removeEventListener('navigation-updated', handleNavUpdate);
    };
  }, []);

  // Đóng mobile menu khi chuyển route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Ngăn cuộn trang khi mobile drawer đang mở
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Nhận diện vai trò Admin
  const isAdminUser =
    user?.role === 'ADMIN' ||
    user?.phoneNumber === 'admin' ||
    user?.email === 'admin@congnguyen.com.vn' ||
    user?.email === 'admin';

  // Lắng nghe click outside để tự động đóng dropdown menu trên desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md" data-nosnippet>
        {/* KHUNG CHỨA CONTAINER CHUẨN: max-w-7xl, padding ngang cân đối, flex items-center justify-between */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* 1. BÊN TRÁI: LOGO & THƯƠNG HIỆU (Cố định độ rộng tự nhiên, shrink-0) */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label={`${brandName || 'Công Nguyên'} - Trang chủ`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 shadow-md group-hover:bg-amber-400 transition" aria-hidden="true">
              {brandLogoText || 'CN'}
            </div>
            <div className="shrink-0 flex flex-col justify-center">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
                {brandName || 'CÔNG NGUYÊN'}
              </span>
              <span className="hidden text-[10px] sm:text-xs uppercase tracking-wider text-amber-700 font-semibold sm:block whitespace-nowrap">
                {brandTagline || 'Giải Pháp Máy Làm Bánh Công Nghiệp'}
              </span>
            </div>
          </Link>

          {/* 2. Ở GIỮA: CỤM MENU ĐIỀU HƯỚNG CHÍNH (flex items-center gap-6 xl:gap-8, ẩn khi < lg) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems
              .filter((item) => item.isVisible !== false && item.isActive !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((item) => {
                const label = item.label || item.title || '';
                const isActive =
                  pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url));
                const isBuyback = item.badge === 'HOT' || item.url.includes('thanh-ly');

                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.isOpenNewTab ? '_blank' : undefined}
                    rel={item.isOpenNewTab ? 'noopener noreferrer' : undefined}
                    className={`whitespace-nowrap text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? isBuyback
                          ? 'text-amber-800 font-bold'
                          : 'text-amber-600 font-bold'
                        : isBuyback
                        ? 'text-amber-700 hover:text-amber-900'
                        : 'text-slate-600 hover:text-amber-600'
                    }`}
                  >
                    <span>{label}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 shadow-2xs ${
                          item.badge.toUpperCase() === 'HOT'
                            ? 'bg-rose-100 text-rose-700'
                            : item.badge.toUpperCase() === 'NEW'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* 3. BÊN PHẢI: CỤM HÀNH ĐỘNG NGƯỜI DÙNG (Giỏ hàng & Tài khoản/Quản trị viên, shrink-0) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* NÚT GIỎ HÀNG */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-amber-600 hover:border-amber-400 cursor-pointer"
              aria-label="Mở giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5 shrink-0" />
              {totalCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-slate-950 shadow-sm shrink-0">
                  {totalCount}
                </span>
              )}
            </button>

            {/* CỤM TÀI KHOẢN / QUẢN TRỊ VIÊN */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition shadow-xs shrink-0 whitespace-nowrap cursor-pointer ${
                    isUserMenuOpen
                      ? 'border-amber-500 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-amber-400'
                  }`}
                >
                  <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    {isAdminUser ? '👑' : user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block max-w-[130px]">
                    <span className="block truncate font-bold text-slate-900 leading-tight">
                      {isAdminUser ? 'Quản trị viên' : user.fullName}
                    </span>
                    {isAdminUser && (
                      <span className="block text-[9px] text-amber-700 font-black uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>

                {/* DROPDOWN MENU TÀI KHOẢN */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-60 z-50 animate-fade-in">
                    <div className="rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 divide-y divide-slate-100">
                      <div className="px-3 py-2.5">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {isAdminUser ? 'Quản trị viên' : user.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {isAdminUser ? 'Quản trị hệ thống (admin)' : user.phoneNumber}
                        </div>
                      </div>

                      <div className="py-1 space-y-0.5">
                        {isAdminUser && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100 transition whitespace-nowrap"
                          >
                            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>⚙️ Trang quản trị (Admin)</span>
                          </Link>
                        )}

                        <Link
                          href="/tracking"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition whitespace-nowrap font-medium"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>Tra cứu báo giá & Đơn cọc</span>
                        </Link>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition whitespace-nowrap cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-amber-600 transition shrink-0"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs hover:bg-slate-50 hover:border-amber-400 transition shrink-0"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* NÚT HAMBURGER MENU MOBILE (< LG) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs lg:hidden hover:bg-slate-50 hover:border-amber-400 active:scale-95 transition shrink-0 cursor-pointer"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 4. MOBILE / TABLET DRAWER TRƯỢT TỪ PHẢI SANG (< LG)      */}
      {/* ======================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop tối mờ */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content trượt từ mép phải */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between z-50 transform transition-transform animate-slide-left">
            <div>
              {/* Header Drawer */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-sm">
                    {brandLogoText || 'CN'}
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block">{brandName || 'CÔNG NGUYÊN'}</span>
                    <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold block">{brandTagline || 'Giải Pháp Máy Làm Bánh'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thông tin tài khoản người dùng */}
              <div className="p-4 border-b border-slate-100 bg-white">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                        {isAdminUser ? '👑' : user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {isAdminUser ? 'Quản trị viên' : user.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email || user.phoneNumber}
                        </div>
                        {isAdminUser && (
                          <span className="inline-block mt-1 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[9px] px-1.5 py-0.5 uppercase">
                            Admin Role
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdminUser && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                          Trang Quản trị Hệ thống (Admin)
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs hover:bg-amber-400 transition"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 transition"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>

              {/* Danh sách liên kết điều hướng Động */}
              <nav className="p-3 space-y-1">
                {navItems
                  .filter((item) => item.isVisible !== false && item.isActive !== false)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item) => {
                    const label = item.label || item.title || '';
                    const isBuyback = item.badge === 'HOT' || item.url.includes('thanh-ly');
                    const isActive =
                      pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url));

                    return (
                      <Link
                        key={item.id}
                        href={item.url}
                        target={item.isOpenNewTab ? '_blank' : undefined}
                        rel={item.isOpenNewTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition ${
                          isBuyback
                            ? 'text-amber-800 bg-amber-50/50 hover:bg-amber-100/50'
                            : isActive
                            ? 'text-amber-600 bg-amber-50/30'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Wrench className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>{label}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`rounded-full font-extrabold text-[9px] px-2 py-0.5 ${
                              item.badge.toUpperCase() === 'HOT'
                                ? 'bg-rose-100 text-rose-700'
                                : item.badge.toUpperCase() === 'NEW'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-200 text-amber-950'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </nav>
            </div>

            {/* Footer Drawer: Hotline & Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Hotline kỹ thuật xưởng 24/7
                </span>
                <a
                  href={`tel:${hotline.replace(/\s+/g, '')}`}
                  className="font-black text-amber-900 text-sm mt-0.5 block hover:underline"
                  title="Gọi ngay hotline"
                >
                  {hotline} (Zalo Kỹ Sư)
                </a>
                <p className="text-[10px] text-slate-500 mt-1">
                  Khảo sát mặt bằng, điện 3 pha và nghiệm thu bột thực tế.
                </p>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
