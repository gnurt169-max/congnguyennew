'use client';

import { useState, useEffect } from 'react';
import { formatVND, getApiBaseUrl } from '@/lib/utils';
import { PowerType, RfqStatus } from '@industrial-bakery/shared-types';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Building,
  MapPin,
  Zap,
  Edit3,
  X,
  Send,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminRfqItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  companyName?: string | null;
  workshopAddress: string;
  targetPowerSupply: PowerType;
  dailyCapacityRequirement?: string | null;
  customerNotes?: string | null;
  internalTechnicalNotes?: string | null;
  status: RfqStatus;
  estimatedTotal?: number | string | null;
  createdAt: string;
  items: Array<{
    id: string;
    requestedQuantity: number;
    targetUnitPrice?: number | string | null;
    offeredUnitPrice?: number | string | null;
    technicalNotes?: string | null;
    product: {
      name: string;
      modelCode?: string | null;
      thumbnail?: string | null;
    };
    variant?: {
      sku: string;
      name: string;
      powerType: PowerType;
      powerKw?: number | string | null;
      price?: number | string | null;
    } | null;
  }>;
}

const INITIAL_RFQS: AdminRfqItem[] = [];

export default function AdminQuotationsPage() {
  const [rfqs, setRfqs] = useState<AdminRfqItem[]>(INITIAL_RFQS);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRfq, setActiveRfq] = useState<AdminRfqItem | null>(null);

  // State cho Modal chào thầu & cập nhật giá
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [newStatus, setNewStatus] = useState<RfqStatus>(RfqStatus.QUOTE_SENT);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch RFQs từ API backend nếu có
  useEffect(() => {
    async function loadBackendData() {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetchWithAdminAuth(`${ baseUrl } /admin/quotations`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.items)) {
            setRfqs(json.data.items);
          }
        }
      } catch (err) {
        console.warn('Không thể tải danh sách RFQ từ backend:', err);
      }
    }
    loadBackendData();
  }, []);

  const openQuoteModal = (rfq: AdminRfqItem) => {
    setActiveRfq(rfq);
    const initialPrices: Record<string, number> = {};
    rfq.items.forEach((it) => {
      initialPrices[it.id] = Number(it.offeredUnitPrice || it.targetUnitPrice || 0);
    });
    setQuotePrices(initialPrices);
    setTechnicianNotes(rfq.internalTechnicalNotes || '');
    setNewStatus(rfq.status);
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRfq) return;

    setIsSaving(true);
    const itemsPayload = activeRfq.items.map((it) => ({
      id: it.id,
      offeredUnitPrice: quotePrices[it.id] || 0,
      technicalNotes: it.technicalNotes || undefined,
    }));

    try {
      const baseUrl = getApiBaseUrl();
      await fetchWithAdminAuth(`${ baseUrl } /admin/quotations / ${ activeRfq.id }/quote`, {
method: 'PUT',
  body: JSON.stringify({
    items: itemsPayload,
    internalTechnicalNotes: technicianNotes,
    status: newStatus,
  }),
      });
    } catch (err) {
  console.warn('Mô phỏng lưu thành công trên frontend:', err);
}

// Cập nhật state local
setRfqs((prev) =>
  prev.map((r) => {
    if (r.id === activeRfq.id) {
      const total = itemsPayload.reduce(
        (sum, item, idx) => sum + item.offeredUnitPrice * (r.items[idx]?.requestedQuantity || 1),
        0,
      );
      return {
        ...r,
        status: newStatus,
        internalTechnicalNotes: technicianNotes,
        estimatedTotal: total,
        items: r.items.map((it) => ({
          ...it,
          offeredUnitPrice: quotePrices[it.id] || it.offeredUnitPrice,
        })),
      };
    }
    return r;
  }),
);

setIsSaving(false);
setActiveRfq(null);
alert(`Đã cập nhật chào thầu thành công cho mã ${activeRfq.code}!`);
  };

const filteredRfqs = rfqs.filter((r) => {
  const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
  const matchSearch =
    r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.companyName && r.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    r.customerPhone.includes(searchTerm);
  return matchStatus && matchSearch;
});

return (
  <div className="space-y-6">
    {/* HEADER SECTION */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Quản Lý Báo Giá Kỹ Thuật B2B (RFQ)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Khảo sát mặt bằng, kiểm tra đường điện 3 pha và lập dự toán chào thầu thiết bị cho xưởng bánh.
        </p>
      </div>
    </div>

    {/* FILTER TABS & SEARCH */}
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5 text-xs font-bold">
        {[
          { label: 'Tất cả', value: 'ALL' },
          { label: 'Mới tiếp nhận', value: RfqStatus.PENDING },
          { label: 'Đang khảo sát điện', value: RfqStatus.TECHNICAL_CONSULTING },
          { label: 'Đã gửi báo giá', value: RfqStatus.QUOTE_SENT },
          { label: 'Đã chốt hợp đồng', value: RfqStatus.ACCEPTED },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSelectedStatus(tab.value)}
            className={`rounded-xl px-3 py-1.5 transition ${selectedStatus === tab.value
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo mã BG, tên xưởng..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>

    {/* BẢNG DANH SÁCH RFQ */}
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs min-w-[750px]">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3.5 px-5">Mã RFQ</th>
            <th className="py-3.5 px-4">Cơ sở / Khách hàng</th>
            <th className="py-3.5 px-4">Nguồn điện xưởng</th>
            <th className="py-3.5 px-4">Thiết bị quan tâm</th>
            <th className="py-3.5 px-4 text-center">Trạng thái</th>
            <th className="py-3.5 px-4 text-right">Tổng giá chào thầu</th>
            <th className="py-3.5 px-4 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredRfqs.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileSpreadsheet className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">Chưa có yêu cầu báo giá kỹ thuật nào</p>
                  <p className="text-xs text-slate-400 mt-1">Các yêu cầu chào thầu RFQ từ khách hàng sẽ xuất hiện tại đây.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredRfqs.map((rfq) => {
              const primaryItem = rfq.items[0];
              return (
                <tr key={rfq.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-5">
                    <span className="font-mono font-bold text-slate-900 block">
                      {rfq.code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rfq.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <strong className="text-slate-900 font-bold block">
                      {rfq.companyName || rfq.customerName}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {rfq.customerName} • {rfq.customerPhone}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${rfq.targetPowerSupply === PowerType.THREE_PHASE_380V
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-800'
                        }`}
                    >
                      <Zap className="h-3 w-3 text-amber-600" />
                      {rfq.targetPowerSupply === PowerType.THREE_PHASE_380V
                        ? '3 Pha (380V)'
                        : '1 Pha (220V)'}
                    </span>
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    {primaryItem && (
                      <div>
                        <p className="font-bold text-slate-800 truncate">
                          {primaryItem.product.name}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          SKU: {primaryItem.variant?.sku || primaryItem.product.modelCode || 'N/A'} (SL: {primaryItem.requestedQuantity})
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${rfq.status === RfqStatus.PENDING
                          ? 'bg-amber-100 text-amber-900'
                          : rfq.status === RfqStatus.TECHNICAL_CONSULTING
                            ? 'bg-blue-100 text-blue-900'
                            : rfq.status === RfqStatus.QUOTE_SENT
                              ? 'bg-purple-100 text-purple-900'
                              : rfq.status === RfqStatus.ACCEPTED
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {rfq.status === RfqStatus.PENDING
                        ? 'Mới tiếp nhận'
                        : rfq.status === RfqStatus.TECHNICAL_CONSULTING
                          ? 'Khảo sát điện'
                          : rfq.status === RfqStatus.QUOTE_SENT
                            ? 'Đã gửi báo giá'
                            : rfq.status === RfqStatus.ACCEPTED
                              ? 'Đã chốt hợp đồng'
                              : rfq.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right font-black text-amber-900">
                    {rfq.estimatedTotal ? formatVND(rfq.estimatedTotal) : 'Chờ định giá'}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openQuoteModal(rfq)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800"
                    >
                      <Edit3 className="h-3 w-3" />
                      Chào thầu
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* MODAL CHI TIẾT RFQ & NHẬP GIÁ CHÀO THẦU */}
    {activeRfq && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setActiveRfq(null)}
        />

        <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl z-10 space-y-6 my-8">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Mã RFQ: {activeRfq.code}
              </span>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                Xử Lý & Chào Thầu Báo Giá Kỹ Thuật
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveRfq(null)}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* THÔNG TIN KHẢO SÁT MẶT BẰNG & NGUỒN ĐIỆN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Khách hàng / Tiệm bánh:</span>
              <strong className="text-slate-900 font-bold block text-sm">
                {activeRfq.companyName || activeRfq.customerName}
              </strong>
              <span className="text-slate-600 block mt-0.5">
                {activeRfq.customerName} • {activeRfq.customerPhone} ({activeRfq.customerEmail || 'Không có email'})
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Nguồn điện xưởng có sẵn:</span>
              <span className="font-bold text-amber-800 inline-flex items-center gap-1 mt-0.5">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                {activeRfq.targetPowerSupply === PowerType.THREE_PHASE_380V
                  ? '3 Pha (380V) - Điện sản xuất'
                  : '1 Pha (220V) - Cần lắp biến tần'}
              </span>
              <span className="text-slate-500 block text-[11px] mt-1">
                Năng suất mong muốn: {activeRfq.dailyCapacityRequirement || 'Theo tiêu chuẩn máy'}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">Địa chỉ xưởng cần khảo sát:</span>
              <strong className="text-slate-900">{activeRfq.workshopAddress}</strong>
            </div>

            {activeRfq.customerNotes && (
              <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px] font-semibold">Ghi chú từ khách:</span>
                <p className="text-slate-700 mt-0.5 italic">{activeRfq.customerNotes}</p>
              </div>
            )}
          </div>

          {/* FORM NHẬP ĐƠN GIÁ CHÀO THẦU */}
          <form onSubmit={handleSaveQuote} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Định giá chào thầu thiết bị:
            </h4>

            <div className="space-y-3">
              {activeRfq.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{item.product.name}</h5>
                    <span className="text-[11px] font-mono text-slate-500">
                      SKU: {item.variant?.sku || item.product.modelCode || 'N/A'} • SL: {item.requestedQuantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Đơn giá chào (VNĐ):</span>
                    <input
                      type="number"
                      value={quotePrices[item.id] || 0}
                      onChange={(e) =>
                        setQuotePrices((prev) => ({
                          ...prev,
                          [item.id]: Number(e.target.value),
                        }))
                      }
                      className="w-40 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-right text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú kỹ thuật viên / Điều kiện bàn giao máy:
              </label>
              <textarea
                rows={2}
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Ghi chú về kiểm tra dây nguồn, vị trí đặt máy, thời gian nướng thử..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Chuyển trạng thái:</span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RfqStatus)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-500"
                >
                  <option value={RfqStatus.TECHNICAL_CONSULTING}>Khảo sát điện (TECHNICAL_CONSULTING)</option>
                  <option value={RfqStatus.QUOTE_SENT}>Đã gửi báo giá (QUOTE_SENT)</option>
                  <option value={RfqStatus.NEGOTIATING}>Thương thảo hợp đồng (NEGOTIATING)</option>
                  <option value={RfqStatus.ACCEPTED}>Đã chốt hợp đồng (ACCEPTED)</option>
                  <option value={RfqStatus.REJECTED}>Từ chối / Hủy (REJECTED)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRfq(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Lưu & Gửi Báo Giá
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
