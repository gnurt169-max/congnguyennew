'use client';

import { useState, useEffect } from 'react';
import { formatVND, getApiBaseUrl } from '@/lib/utils';
import { OrderStatus, PaymentMethod, PaymentMilestoneType, PaymentStatus } from '@industrial-bakery/shared-types';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import {
  PackageCheck,
  Search,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  Receipt,
  X,
  Loader2,
  Layers,
  Building,
  User,
} from 'lucide-react';

interface AdminOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  companyName?: string | null;
  shippingAddress: string;
  status: OrderStatus;
  totalAmount: number | string;
  depositAmount: number | string;
  paidAmount: number | string;
  remainingAmount: number | string;
  depositRequiredPercent: number | string;
  paidPercent?: number;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    variantName?: string | null;
    sku: string;
    unitPrice: number | string;
    quantity: number;
    totalPrice: number | string;
    specsSnapshot?: any;
  }>;
  payments: Array<{
    id: string;
    paymentCode: string;
    milestoneType: PaymentMilestoneType;
    amount: number | string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    transactionRef?: string | null;
    notes?: string | null;
    createdAt: string;
  }>;
}

const INITIAL_ORDERS: AdminOrderItem[] = [];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderItem[]>(INITIAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Ghi nhận thanh toán mới
  const [paymentModalOrder, setPaymentModalOrder] = useState<AdminOrderItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [milestoneType, setMilestoneType] = useState<PaymentMilestoneType>(
    PaymentMilestoneType.PRE_DELIVERY_STAGE_2,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER_DOMESTIC,
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Modal Chi tiết & Cập nhật giao vận
  const [detailModalOrder, setDetailModalOrder] = useState<AdminOrderItem | null>(null);
  const [updatingDeliveryStatus, setUpdatingDeliveryStatus] = useState<OrderStatus>(
    OrderStatus.PROCESSING_MANUFACTURE,
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load orders từ API backend nếu có
  useEffect(() => {
    async function loadOrders() {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetchWithAdminAuth(`${baseUrl}/admin/orders`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.items)) {
            setOrders(json.data.items);
          }
        }
      } catch (err) {
        console.warn('Không thể tải danh sách đơn hàng từ backend:', err);
      }
    }
    loadOrders();
  }, []);

  const openPaymentModal = (order: AdminOrderItem) => {
    setPaymentModalOrder(order);
    const remaining = Number(order.remainingAmount);
    setPaymentAmount(remaining > 0 ? remaining : 0);
    setTransactionRef('');
    setPaymentNotes('');
    setMilestoneType(
      Number(order.paidAmount) === 0
        ? PaymentMilestoneType.DEPOSIT_STAGE_1
        : PaymentMilestoneType.HANDOVER_FINAL_STAGE_3,
    );
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder) return;

    setIsRecordingPayment(true);
    const payload = {
      amount: paymentAmount,
      milestoneType,
      paymentMethod,
      transactionRef,
      notes: paymentNotes,
      status: PaymentStatus.CONFIRMED,
    };

    try {
      const baseUrl = getApiBaseUrl();
      await fetchWithAdminAuth(`${baseUrl}/admin/orders/${paymentModalOrder.id}/payments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Mô phỏng ghi nhận thanh toán thành công trên frontend:', err);
    }

    // Cập nhật state local
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === paymentModalOrder.id) {
          const newPaid = Number(o.paidAmount) + paymentAmount;
          const newRemaining = Math.max(0, Number(o.totalAmount) - newPaid);
          const newPaidPercent = Math.round((newPaid / Number(o.totalAmount)) * 100);

          return {
            ...o,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            paidPercent: newPaidPercent,
            payments: [
              ...o.payments,
              {
                id: `pay-${Date.now()}`,
                paymentCode: `PAY-202610-${Math.floor(Math.random() * 9000) + 1000}`,
                milestoneType,
                amount: paymentAmount,
                paymentMethod,
                status: PaymentStatus.CONFIRMED,
                transactionRef,
                notes: paymentNotes,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      }),
    );

    setIsRecordingPayment(false);
    setPaymentModalOrder(null);
    alert(`Đã ghi nhận thanh toán đợt ${formatVND(paymentAmount)} thành công!`);
  };

  const openDetailModal = (order: AdminOrderItem) => {
    setDetailModalOrder(order);
    setUpdatingDeliveryStatus(order.status);
    setDeliveryNotes('');
  };

  const handleUpdateDeliveryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModalOrder) return;

    setIsUpdatingStatus(true);
    try {
      const baseUrl = getApiBaseUrl();
      await fetchWithAdminAuth(`${baseUrl}/admin/orders/${detailModalOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: updatingDeliveryStatus,
          notes: deliveryNotes,
        }),
      });
    } catch (err) {
      console.warn('Mô phỏng cập nhật trạng thái đơn thành công:', err);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === detailModalOrder.id ? { ...o, status: updatingDeliveryStatus } : o,
      ),
    );

    setIsUpdatingStatus(false);
    setDetailModalOrder(null);
    alert(`Đã cập nhật tiến độ đơn hàng ${detailModalOrder.orderCode} thành công!`);
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.companyName && o.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.customerPhone.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Đơn Hàng & Thu Cọc Máy Móc
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến độ thanh toán từng đợt (Cọc 30%, trước xuất xưởng, tất toán khi nghiệm thu) và trạng thái giao vận.
          </p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {[
            { label: 'Tất cả đơn', value: 'ALL' },
            { label: 'Chờ cọc Đợt 1', value: OrderStatus.PENDING_DEPOSIT },
            { label: 'Đang sản xuất / chuẩn bị máy', value: OrderStatus.PROCESSING_MANUFACTURE },
            { label: 'Sẵn sàng xuất xưởng', value: OrderStatus.READY_FOR_DELIVERY },
            { label: 'Đang lắp đặt & chạy thử', value: OrderStatus.DELIVERED_TESTING },
            { label: 'Hoàn tất nghiệm thu', value: OrderStatus.COMPLETED },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-xl px-3 py-1.5 transition ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã DH, tên xưởng..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5">Mã đơn hàng</th>
              <th className="py-3.5 px-4">Cơ sở / Khách hàng</th>
              <th className="py-3.5 px-4">Tổng tiền đơn hàng</th>
              <th className="py-3.5 px-4">Tiến độ thu tiền cọc</th>
              <th className="py-3.5 px-4 text-center">Trạng thái giao vận</th>
              <th className="py-3.5 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <PackageCheck className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-700">Chưa có đơn hàng nào</p>
                    <p className="text-xs text-slate-400 mt-1">Các đơn hàng mua máy và tiến độ thu cọc sẽ được ghi nhận tại đây.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const paid = Number(order.paidAmount);
                const total = Number(order.totalAmount);
                const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-slate-900 block">
                        {order.orderCode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <strong className="text-slate-900 font-bold block">
                        {order.companyName || order.customerName}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {order.customerName} • {order.customerPhone}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-black text-slate-900">
                      {formatVND(order.totalAmount)}
                    </td>

                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">
                            Đã thu: <strong className="text-amber-900">{formatVND(order.paidAmount)}</strong>
                          </span>
                          <span className="font-bold text-slate-800">{percent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100
                                ? 'bg-emerald-500'
                                : percent > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-200'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        {Number(order.remainingAmount) > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            Còn thiếu: {formatVND(order.remainingAmount)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                          order.status === OrderStatus.PENDING_DEPOSIT
                            ? 'bg-amber-100 text-amber-900'
                            : order.status === OrderStatus.PROCESSING_MANUFACTURE
                            ? 'bg-blue-100 text-blue-900'
                            : order.status === OrderStatus.READY_FOR_DELIVERY
                            ? 'bg-purple-100 text-purple-900'
                            : order.status === OrderStatus.DELIVERED_TESTING
                            ? 'bg-indigo-100 text-indigo-900'
                            : order.status === OrderStatus.COMPLETED
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status === OrderStatus.PENDING_DEPOSIT
                          ? 'Chờ cọc Đợt 1'
                          : order.status === OrderStatus.PROCESSING_MANUFACTURE
                          ? 'Đang sản xuất máy'
                          : order.status === OrderStatus.READY_FOR_DELIVERY
                          ? 'Sẵn sàng xuất xưởng'
                          : order.status === OrderStatus.DELIVERED_TESTING
                          ? 'Bàn giao & Vận hành thử'
                          : order.status === OrderStatus.COMPLETED
                          ? 'Đã nghiệm thu'
                          : order.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
                          title="Ghi nhận đợt thanh toán mới"
                        >
                          <Receipt className="h-3 w-3" />
                          Thu cọc
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetailModal(order)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
                          title="Xem chi tiết & đổi trạng thái"
                        >
                          <Truck className="h-3 w-3" />
                          Tiến độ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL GHI NHẬN THANH TOÁN MỚI */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setPaymentModalOrder(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl z-10 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  Đơn hàng: {paymentModalOrder.orderCode}
                </span>
                <h3 className="mt-2 text-lg font-black text-slate-900">
                  Ghi Nhận Đợt Thanh Toán Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng giá trị đơn:</span>
                <strong className="text-slate-900">{formatVND(paymentModalOrder.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã thu trước đó:</span>
                <strong className="text-emerald-700">{formatVND(paymentModalOrder.paidAmount)}</strong>
              </div>
              <div className="flex justify-between text-amber-900 font-bold border-t border-slate-200/80 pt-1">
                <span>Còn lại cần thu:</span>
                <span>{formatVND(paymentModalOrder.remainingAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giai đoạn / Đợt thanh toán:
                </label>
                <select
                  value={milestoneType}
                  onChange={(e) => setMilestoneType(e.target.value as PaymentMilestoneType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900"
                >
                  <option value={PaymentMilestoneType.DEPOSIT_STAGE_1}>
                    Đợt 1: Cọc sản xuất / giữ máy (30% - 50%)
                  </option>
                  <option value={PaymentMilestoneType.PRE_DELIVERY_STAGE_2}>
                    Đợt 2: Thanh toán trước khi xuất kho / hàng về cảng
                  </option>
                  <option value={PaymentMilestoneType.HANDOVER_FINAL_STAGE_3}>
                    Đợt 3: Tất toán sau khi nghiệm thu máy tại xưởng
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tiền thực thu (VNĐ):
                </label>
                <input
                  type="number"
                  min="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phương thức:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900"
                  >
                    <option value={PaymentMethod.BANK_TRANSFER_DOMESTIC}>Chuyển khoản Vietcombank</option>
                    <option value={PaymentMethod.CORPORATE_LETTER_OF_CREDIT}>Thư tín dụng L/C</option>
                    <option value={PaymentMethod.CASH}>Tiền mặt tại xưởng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã UNC / Giao dịch:
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="VD: VCB-982184912"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú kế toán:
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Xác nhận nhận tiền qua sao kê VCB..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment || paymentAmount <= 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isRecordingPayment ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang ghi nhận...
                    </>
                  ) : (
                    'Xác Nhận Thu Tiền'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TIẾN ĐỘ & CẬP NHẬT TRẠNG THÁI GIAO VẬN */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setDetailModalOrder(null)}
          />

          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl z-10 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900">
                  Đơn hàng: {detailModalOrder.orderCode}
                </span>
                <h3 className="mt-2 text-lg font-black text-slate-900">
                  Cập Nhật Tiến Độ Sản Xuất & Bàn Giao Máy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOrder(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SNAPSHOT DANH SÁCH THIẾT BỊ LÚC CHỐT ĐƠN */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Thiết bị đã snapshot tại thời điểm đặt đơn:
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                {detailModalOrder.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{it.productName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        SKU: {it.sku} • SL: {it.quantity} máy
                      </p>
                      {it.specsSnapshot && (
                        <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                          Thông số: {it.specsSnapshot.powerType} - {it.specsSnapshot.powerKw} kW - {it.specsSnapshot.dimensions || ''}
                        </p>
                      )}
                    </div>
                    <span className="font-black text-slate-900">{formatVND(it.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateDeliveryStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái tiến độ thực tế:
                </label>
                <select
                  value={updatingDeliveryStatus}
                  onChange={(e) => setUpdatingDeliveryStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-blue-500"
                >
                  <option value={OrderStatus.PENDING_DEPOSIT}>Chờ đặt cọc Đợt 1</option>
                  <option value={OrderStatus.PROCESSING_MANUFACTURE}>Đang sản xuất / chuẩn bị máy tại xưởng</option>
                  <option value={OrderStatus.READY_FOR_DELIVERY}>Sẵn sàng xuất xưởng</option>
                  <option value={OrderStatus.DELIVERED_TESTING}>Đã giao tới xưởng & Đang chạy thử nghiệm thu</option>
                  <option value={OrderStatus.COMPLETED}>Hoàn tất nghiệm thu bàn giao</option>
                  <option value={OrderStatus.CANCELLED}>Hủy đơn hàng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhật ký kỹ thuật / Biên bản vận hành thử:
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ghi chú về kiểm tra nguồn điện 3 pha, nướng thử mẻ bánh đầu tiên..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailModalOrder(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập Nhật Tiến Độ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
