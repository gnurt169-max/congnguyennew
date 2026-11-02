'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { formatVND, normalizeImagePath } from '@/lib/utils';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeItem,
    updateQuantity,
    totalCount,
    totalAmount,
  } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartDrawerOpen]);

  if (!mounted || !isCartDrawerOpen) return null;

  const deposit30 = totalAmount * 0.3;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* HEADER DRAWER */}
          <div className="border-b border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Giỏ hàng của bạn ({totalCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng giỏ hàng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* LIST OF CART ITEMS */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Giỏ hàng hiện đang trống
                </p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Khám phá danh mục lò nướng, máy trộn bột xoắn ốc và phụ kiện chính hãng.
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-6 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Xem danh mục thiết bị
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.sku}
                  className="flex gap-4 rounded-2xl border border-slate-100 p-3 bg-slate-50/50"
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200">
                    {(item.imageUrl || item.thumbnail) ? (
                      <Image
                        src={normalizeImagePath(item.imageUrl || item.thumbnail)}
                        alt={`Thiết bị làm bánh - ${item.name}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                        CN
                      </div>
                    )}
                  </div>

                  {/* Info & Counter */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.sku)}
                          className="text-slate-400 hover:text-red-500"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono">SKU: {item.sku}</span>
                        {item.variantName && <span>• {item.variantName}</span>}
                      </div>

                      <p className="text-xs font-bold text-amber-700 mt-1">
                        {formatVND(item.price)}
                      </p>
                    </div>

                    {/* Quantity control */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        = {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER & CHECKOUT */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 p-6 space-y-4 bg-white">
              {/* Special industrial note */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Chính sách cọc thiết bị công nghiệp:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Hỗ trợ đặt cọc 30% (<strong>{formatVND(deposit30)}</strong>) để tiến hành giữ máy và lắp đặt. Tất toán phần còn lại sau khi nghiệm thu tại xưởng.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tổng tiền thiết bị:</span>
                  <span className="font-bold text-slate-900">{formatVND(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Dự kiến cọc Đợt 1 (30%):</span>
                  <span>{formatVND(deposit30)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-200 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Xem chi tiết giỏ
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-1/2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-center text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400"
                >
                  <span>Đặt cọc & Thanh toán</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
