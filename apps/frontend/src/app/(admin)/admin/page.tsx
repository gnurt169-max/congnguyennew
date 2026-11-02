'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatVND, getApiBaseUrl } from '@/lib/utils';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import {
  FileSpreadsheet,
  PackageCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Zap,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [rfqList, setRfqList] = useState<any[]>([]);
  const [orderList, setOrderList] = useState<any[]>([]);

  useEffect(() => {
    async function loadOverview() {
      const baseUrl = getApiBaseUrl();
      try {
        const [rfqRes, orderRes] = await Promise.all([
          fetchWithAdminAuth(`${baseUrl}/admin/quotations`),
          fetchWithAdminAuth(`${baseUrl}/admin/orders`),
        ]);
        if (rfqRes.ok) {
          const json = await rfqRes.json();
          if (json.success && Array.isArray(json.data?.items)) {
            setRfqList(json.data.items);
          }
        }
        if (orderRes.ok) {
          const json = await orderRes.json();
          if (json.success && Array.isArray(json.data?.items)) {
            setOrderList(json.data.items);
          }
        }
      } catch (err) {
        console.warn('Không thể tải dữ liệu tổng quan admin:', err);
      }
    }
    loadOverview();
  }, []);

  const pendingRfqs = rfqList.filter((r) => r.status === 'PENDING' || r.status === 'TECHNICAL_CONSULTING');
  const pendingOrders = orderList.filter((o) => o.status === 'PENDING_DEPOSIT');
  const activeOrders = orderList.filter((o) => o.status === 'PROCESSING_MANUFACTURE' || o.status === 'READY_FOR_DELIVERY' || o.status === 'DELIVERED_TESTING');
  const totalValue = orderList.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
  const totalPaid = orderList.reduce((acc, o) => acc + Number(o.paidAmount || 0), 0);

  const kpis = [
    {
      title: 'RFQ Chờ Xử Lý & Chào Thầu',
      value: `${pendingRfqs.length}`,
      sub: pendingRfqs.length > 0 ? `${pendingRfqs.length} yêu cầu cần phản hồi` : 'Chưa có yêu cầu mới',
      icon: FileSpreadsheet,
      color: 'bg-amber-500 text-slate-950',
      href: '/admin/quotations?status=PENDING',
    },
    {
      title: 'Đơn Hàng Chờ Đặt Cọc Đợt 1',
      value: `${pendingOrders.length}`,
      sub: pendingOrders.length > 0 ? `${pendingOrders.length} đơn chờ thu cọc` : 'Không có đơn chờ cọc',
      icon: PackageCheck,
      color: 'bg-blue-600 text-white',
      href: '/admin/orders?status=PENDING_DEPOSIT',
    },
    {
      title: 'Máy Đang Lắp Đặt / Nghiệm Thu',
      value: `${activeOrders.length}`,
      sub: activeOrders.length > 0 ? `${activeOrders.length} máy đang thực hiện` : 'Chưa có máy đang lắp đặt',
      icon: Zap,
      color: 'bg-emerald-600 text-white',
      href: '/admin/orders?status=DELIVERED_TESTING',
    },
    {
      title: 'Tổng Giá Trị Đang Thực Hiện',
      value: totalValue > 0 ? formatVND(totalValue) : '0 đ',
      sub: totalPaid > 0 ? `Đã thu cọc: ${formatVND(totalPaid)}` : 'Đã thu cọc: 0 đ',
      icon: TrendingUp,
      color: 'bg-slate-900 text-white',
      href: '/admin/orders',
    },
  ];

  const recentRfqs = rfqList.slice(0, 5);
  const recentOrders = orderList.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bảng Điều Khiển Quản Trị B2B
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi dòng chảy báo giá kỹ thuật RFQ, tiền cọc đơn hàng và tiến độ lắp đặt máy làm bánh.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/quotations"
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
          >
            Xử lý báo giá ngay
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Quản lý thu cọc
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={`kpi-${idx}`}
              href={kpi.href}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-amber-400 transition hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* HAI KHỐI HOẠT ĐỘNG GẦN ĐÂY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KHỐI 1: YÊU CẦU BÁO GIÁ CẦN CHÀO THẦU */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Yêu cầu báo giá kỹ thuật gần đây
              </h2>
            </div>
            <Link
              href="/admin/quotations"
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRfqs.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300 stroke-[1.5]" />
                <p className="mt-2 text-xs font-bold text-slate-600">Chưa có yêu cầu báo giá kỹ thuật nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Yêu cầu từ khách hàng sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              recentRfqs.map((rfq) => {
                const code = rfq.code;
                const title = rfq.companyName || rfq.bakery || rfq.customerName || rfq.customer || 'Khách hàng';
                const machine = rfq.machine || (rfq.items?.[0]?.product?.name) || 'Thiết bị';
                const power = rfq.power || (rfq.targetPowerSupply === 'THREE_PHASE_380V' ? '380V (3 Pha)' : '220V (1 Pha)');
                return (
                  <div key={code} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{code}</span>
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-bold text-amber-800 text-[10px]">
                          {power}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-700 mt-0.5">{title}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{machine}</p>
                    </div>

                    <div className="text-right">
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900">
                        {rfq.statusText || rfq.status}
                      </span>
                      <Link
                        href={`/admin/quotations`}
                        className="block text-[11px] text-amber-700 font-semibold mt-1 hover:underline"
                      >
                        Báo giá →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KHỐI 2: ĐƠN HÀNG VÀ TIẾN ĐỘ THU CỌC */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Tiến độ đơn hàng & thu cọc máy móc
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <PackageCheck className="mx-auto h-8 w-8 text-slate-300 stroke-[1.5]" />
                <p className="mt-2 text-xs font-bold text-slate-600">Chưa có đơn hàng nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Đơn hàng và tiến độ thu cọc sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              recentOrders.map((ord) => {
                const code = ord.orderCode || ord.code;
                const title = ord.companyName || ord.bakery || ord.customerName || ord.customer || 'Khách hàng';
                const total = Number(ord.totalAmount || ord.total || 0);
                const paid = Number(ord.paidAmount || ord.paid || 0);
                const depositPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
                return (
                  <div key={code} className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{code}</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{title}</p>
                      </div>
                      <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-900">
                        {ord.statusText || ord.status}
                      </span>
                    </div>

                    {/* Progress bar thu cọc */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Thu cọc: <strong>{formatVND(paid)}</strong> / {formatVND(total)}</span>
                        <span className="font-bold text-amber-900">{depositPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${depositPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
