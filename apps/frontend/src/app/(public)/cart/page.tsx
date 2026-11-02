'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { formatVND, normalizeImagePath } from '@/lib/utils';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Home,
  RotateCcw,
} from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalCount } =
    useCart();

  const deposit30 = totalAmount * 0.3;
  const deposit50 = totalAmount * 0.5;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="flex items-center gap-1 hover:text-amber-600">
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">Giỏ hàng của bạn</span>
        </nav>

        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Giỏ Hàng Thiết Bị & Phụ Kiện
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              Kiểm tra danh sách máy móc, linh kiện và lựa chọn tỷ lệ đặt cọc xuất xưởng.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa sạch giỏ hàng
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="my-16 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Chưa có máy móc hoặc linh kiện nào được thêm vào giỏ. Hãy tham khảo các dòng lò nướng, máy trộn bột xoắn ốc hoặc khay nướng tiêu chuẩn công nghiệp.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/products"
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
              >
                Khám phá Danh mục thiết bị
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* DANH SÁCH SẢN PHẨM (8 COLS) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Thiết bị / Linh kiện</th>
                      <th className="py-3.5 px-4 text-center">Đơn giá</th>
                      <th className="py-3.5 px-4 text-center">Số lượng</th>
                      <th className="py-3.5 px-4 text-right">Thành tiền</th>
                      <th className="py-3.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.sku} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {(item.imageUrl || item.thumbnail) ? (
                                <Image
                                  src={normalizeImagePath(item.imageUrl || item.thumbnail)}
                                  alt={`Thiết bị làm bánh - ${item.name}`}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                                  CN
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 line-clamp-1">
                                {item.name}
                              </h3>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                SKU: {item.sku}
                              </p>
                              {item.variantName && (
                                <p className="text-[11px] text-amber-800 font-medium">
                                  {item.variantName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-semibold text-slate-800">
                          {formatVND(item.price)}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                              className="p-1 text-slate-500 hover:text-slate-900"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-bold text-slate-900">
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
                        </td>

                        <td className="py-4 px-4 text-right font-black text-amber-900">
                          {formatVND(item.price * item.quantity)}
                        </td>

                        <td className="py-4 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.sku)}
                            className="text-slate-400 hover:text-red-600 transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/products"
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  ← Tiếp tục xem danh mục thiết bị
                </Link>
              </div>
            </div>

            {/* BẢNG TỔNG HỢP VÀ PHƯƠNG ÁN ĐẶT CỌC (4 COLS) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-slate-900">
                  Tóm tắt đơn hàng ({totalCount} sản phẩm)
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng tiền thiết bị:</span>
                    <span className="font-bold text-slate-900">{formatVND(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí khảo sát điện & lắp đặt:</span>
                    <span className="font-semibold text-emerald-600">MIỄN PHÍ</span>
                  </div>
                </div>

                {/* KHỐI ƯỚC TÍNH ĐẶT CỌC THEO ĐỢT */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Chính sách đặt cọc thiết bị công nghiệp:
                  </div>
                  <div className="text-[11px] text-amber-900 space-y-1">
                    <div className="flex justify-between">
                      <span>• Cọc 30% (Chế tạo / Giữ máy):</span>
                      <strong className="text-amber-900">{formatVND(deposit30)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Cọc 50% (Hàng xuất xưởng):</span>
                      <strong className="text-amber-900">{formatVND(deposit50)}</strong>
                    </div>
                    <p className="text-[10px] text-amber-700/90 pt-1">
                      * Phần còn lại sẽ thanh toán sau khi kỹ sư bàn giao và chạy thử mẻ bánh đầu tiên tại xưởng.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-[0.98]"
                >
                  <span>Tiến hành Đặt cọc & Thanh toán</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
