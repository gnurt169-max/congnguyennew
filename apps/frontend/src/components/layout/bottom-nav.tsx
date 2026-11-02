'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Home, Wrench, FileSpreadsheet, ShoppingCart, User, PlusCircle } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount, setIsCartDrawerOpen } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Không hiển thị Bottom Navigation trên các trang quản trị Admin
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const isProducts = pathname.startsWith('/products') && pathname !== '/products?isQuoteOnly=true';
  const isTracking = pathname.startsWith('/tracking');
  const isAccount = pathname.startsWith('/login') || pathname.startsWith('/register') || (isAuthenticated && isTracking);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden shadow-lg shadow-slate-900/10"
      aria-label="Thanh điều hướng di động dính đáy"
      data-nosnippet
    >
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto">
        {/* 1. TRANG CHỦ */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isHome ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className={`h-5 w-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">Trang chủ</span>
        </Link>

        {/* 2. KHO MÁY */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isProducts ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className={`h-5 w-5 ${isProducts ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">Kho máy</span>
        </Link>

        {/* 3. NÚT NỔI BẬT Ở GIỮA: YÊU CẦU BÁO GIÁ (RFQ) */}
        <div className="flex flex-col items-center justify-center">
          <Link
            href="/products?isQuoteOnly=true"
            className="flex flex-col items-center justify-center -mt-6 group"
            title="Yêu cầu Báo giá Kỹ thuật RFQ"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-tr from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-500/40 ring-4 ring-white group-active:scale-95 transition-transform">
              <FileSpreadsheet className="h-6 w-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-1 font-bold text-amber-700">Báo giá</span>
          </Link>
        </div>

        {/* 4. GIỎ HÀNG */}
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Mở giỏ hàng"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 stroke-2" />
            {totalCount > 0 && (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 shadow-xs">
                {totalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">Giỏ hàng</span>
        </button>

        {/* 5. TÀI KHOẢN */}
        <Link
          href={isAuthenticated ? (user?.role === 'ADMIN' ? '/admin' : '/tracking') : '/login'}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isAccount ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className={`h-5 w-5 ${isAccount ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold truncate max-w-[56px]">
            {isAuthenticated ? (user?.role === 'ADMIN' ? 'Admin' : 'Tài khoản') : 'Tài khoản'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
