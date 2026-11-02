'use client';

import React from 'react';
import { formatVND } from '@/lib/utils';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react';

export interface DepositReceiptData {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  companyName?: string;
  taxCode?: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  depositPercent: number;
  paymentMethod: string;
  paidAt: string;
  items?: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

interface DepositReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DepositReceiptData;
}

export function DepositReceiptModal({ isOpen, onClose, data }: DepositReceiptModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.paidAt || Date.now()).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:m-0 print:max-w-full">
        {/* THANH ĐIỀU KHIỂN TRÊN CÙNG (ẨN KHI IN) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FileText className="h-4 w-4 text-amber-600" />
            <span>Phiếu Thu Điện Tử & Hóa Đơn Đặt Cọc Máy Bánh</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In Phiếu Thu / Lưu PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG PHIẾU THU CHÍNH (IN ĐƯỢC) */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-900 font-sans" id="printable-deposit-receipt">
          {/* HEADER DOANH NGHIỆP */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-base shadow-sm">
                  CN
                </span>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-950">
                    CÔNG NGUYÊN BAKERY MACHINERY
                  </h2>
                  <p className="text-[11px] font-semibold text-amber-700">
                    Chuyên Thiết Bị Làm Bánh Công Nghiệp Thanh Lý & Tân Trang
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Xưởng: 6/3 DN4, P. Đông Hưng Thuận, Q.12, TP.HCM</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Hotline / Zalo kỹ thuật: <strong>0976 619 044</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Website chính thức: <strong>https://congnguyen.com.vn</strong></span>
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <span className="inline-block rounded-xl bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 uppercase tracking-wider">
                ĐÃ THU CỌC ĐỢT 1
              </span>
              <div className="mt-2 text-xs font-mono">
                <span className="text-slate-500">Mã đơn: </span>
                <strong className="text-sm font-bold text-slate-900">{data.orderCode}</strong>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Ngày thu: {formattedDate}</p>
            </div>
          </div>

          {/* TIÊU ĐỀ PHIẾU THU */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-950 tracking-tight">
              PHIẾU THU TIỀN ĐẶT CỌC GIỮ MÁY
            </h1>
            <p className="text-xs text-slate-500">
              (Biên nhận điện tử có giá trị xác lập quyền sở hữu và bảo lưu máy tại kho)
            </p>
          </div>

          {/* THÔNG TIN KHÁCH HÀNG */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Người đặt mua:</span>
              <strong className="font-bold text-slate-900 text-sm">{data.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Số điện thoại:</span>
              <strong className="font-mono font-bold text-slate-900 text-sm">{data.customerPhone}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block text-[11px]">Địa chỉ giao & lắp đặt:</span>
              <span className="font-medium text-slate-800">{data.shippingAddress}</span>
            </div>
            {data.companyName && (
              <div className="sm:col-span-2 pt-1 border-t border-slate-200">
                <span className="text-slate-500 block text-[11px]">Đơn vị xuất hóa đơn:</span>
                <span className="font-bold text-slate-900">{data.companyName}</span>
                {data.taxCode && <span className="ml-2 font-mono text-slate-600">(MST: {data.taxCode})</span>}
              </div>
            )}
          </div>

          {/* DANH MỤC THIẾT BỊ BẢO LƯU */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Danh mục thiết bị làm bánh bảo lưu:
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">Thiết bị</th>
                    <th className="p-2.5 text-center">SL</th>
                    <th className="p-2.5 text-right">Đơn giá</th>
                    <th className="p-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items && data.items.length > 0 ? (
                    data.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <strong className="font-bold text-slate-900 block">{item.productName}</strong>
                          {item.variantName && (
                            <span className="text-[11px] text-slate-500">{item.variantName}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatVND(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(item.totalPrice)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-500 italic">
                        Đơn hàng thiết bị làm bánh công nghiệp tân trang chuẩn xưởng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BẢNG TÍNH TIỀN & CỌC */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tổng giá trị đơn hàng:</span>
              <strong className="text-slate-900 font-bold">{formatVND(data.totalAmount)}</strong>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold text-sm pt-2 border-t border-emerald-200">
              <span>Số tiền cọc Đợt 1 ({data.depositPercent}% - ĐÃ THANH TOÁN):</span>
              <strong className="text-base text-emerald-700 font-black">
                {formatVND(data.depositAmount)}
              </strong>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>Số tiền còn lại thanh toán khi nghiệm thu bàn giao:</span>
              <strong className="font-bold text-slate-900">{formatVND(data.remainingAmount)}</strong>
            </div>
          </div>

          {/* CAM KẾT & DẤU MỘC ĐIỆN TỬ */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="space-y-1 text-[11px] text-slate-600 max-w-sm">
              <strong className="text-slate-900 block text-xs">Cam kết kỹ thuật Công Nguyên:</strong>
              <p>✓ Bảo hành kỹ thuật tận nơi 12 tháng.</p>
              <p>✓ Đổi trả miễn phí trong 7 ngày nếu phát sinh lỗi kỹ thuật bo mạch/motor.</p>
              <p>✓ Hỗ trợ kỹ thuật viên cân chỉnh nhiệt độ và nướng mẻ bánh đầu tiên tại xưởng.</p>
            </div>

            <div className="text-center w-full sm:w-48 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Đại diện Công Nguyên</span>
              <div className="mx-auto flex h-16 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-red-400 bg-red-50 text-red-700 font-black text-xs rotate-[-3deg] shadow-xs">
                <span>[ ĐÃ THU TIỀN ]<br/>CÔNG NGUYÊN</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Xác thực điện tử 0976 619 044</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
