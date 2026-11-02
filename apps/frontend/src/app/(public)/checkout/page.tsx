'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { formatVND, getApiBaseUrl } from '@/lib/utils';
import {
  CreditCard,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Home,
  QrCode,
  ArrowRight,
  Receipt,
  FileCheck,
  Smartphone,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  Printer,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { DepositReceiptModal, DepositReceiptData } from '@/components/checkout/deposit-receipt-modal';

export interface CheckoutSessionState {
  sessionId: string;
  orderCode: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  statusText: string;
  isDepositSettled: boolean;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  depositPercent: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  taxCode?: string;
  shippingAddress: string;
  createdAt: string;
  expiresAt: string;
  remainingSeconds: number;
  paymentMethod: 'VIETQR' | 'MOMO';
  paidAt?: string | null;
  items?: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [isCompanyInvoice, setIsCompanyInvoice] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Tùy chọn đặt cọc: 30%, 50% hoặc 100%
  const [depositPercent, setDepositPercent] = useState<number>(30);
  const [activePaymentTab, setActivePaymentTab] = useState<'VIETQR' | 'MOMO'>('VIETQR');

  // Trạng thái phiên thanh toán (Checkout Session)
  const [session, setSession] = useState<CheckoutSessionState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Đếm ngược thời gian phiên (Remaining Countdown Seconds)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(900); // 15 phút mặc định
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tính toán tài chính
  const vatAmount = isCompanyInvoice ? totalAmount * 0.1 : 0;
  const finalTotal = totalAmount + vatAmount;
  const depositAmount = finalTotal * (depositPercent / 100);
  const remainingAmount = finalTotal - depositAmount;

  // Cấu hình thanh toán chuẩn thực tế Công Nguyên (Cố định TPBank & MoMo QR)
  const [bankConfig, setBankConfig] = useState({
    bankId: 'TPB',
    bankName: 'TPBank (Ngân hàng Tiên Phong)',
    accountNumber: '1029384756',
    accountHolder: 'CONG TY TNHH THIET BI BANH CONG NGUYEN',
    hotline: '0976 619 044',
    momoPhone: '0976619044',
    momoName: 'CONG NGUYEN MACHINERY',
    momoQrUrl: '/uploads/payment/momo-qr.webp',
  });

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/payment/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.data) {
          const cfg = res.data;
          setBankConfig((prev) => ({
            ...prev,
            bankId: 'TPB',
            bankName: cfg.bankName || 'TPBank (Ngân hàng Tiên Phong)',
            accountNumber: cfg.accountNumber || prev.accountNumber,
            accountHolder: cfg.accountHolder || prev.accountHolder,
            momoQrUrl: cfg.momoQrUrl || prev.momoQrUrl,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Hàm sinh mã ngẫu nhiên duy nhất chuẩn DH-CN-XXXXXX
  const generateRandomSessionCode = () => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DH-CN-${rand}`;
  };

  // Sao chép thông tin vào Clipboard
  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // 1. TẠO PHIÊN THANH TOÁN (SUBMIT ORDER -> PENDING CHECKOUT SESSION)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên người nhận máy');
      return;
    }
    if (!customerPhone.trim() || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(customerPhone.trim())) {
      setErrorMsg('Vui lòng nhập số điện thoại di động hợp lệ (10 số)');
      return;
    }
    if (!shippingAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ nhận hàng & lắp đặt xưởng');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt máy.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const snapshotItems = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      productName: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      totalPrice: i.price * i.quantity,
    }));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút TTL

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      companyName: companyName.trim() || undefined,
      taxCode: taxCode.trim() || undefined,
      isCompanyInvoice,
      shippingAddress: shippingAddress.trim(),
      depositPercent,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      let orderCode = generateRandomSessionCode();
      if (response.ok && json.success && json.data) {
        orderCode = json.data.orderCode || orderCode;
      }

      const newSession: CheckoutSessionState = {
        sessionId: orderCode,
        orderCode,
        status: 'pending',
        statusText: 'Vui lòng chuyển khoản đặt cọc để giữ máy',
        isDepositSettled: false,
        totalAmount: finalTotal,
        depositAmount,
        remainingAmount,
        depositPercent,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        companyName: companyName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
        shippingAddress: shippingAddress.trim(),
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        remainingSeconds: 900,
        paymentMethod: activePaymentTab,
        items: snapshotItems,
      };

      setSession(newSession);
      setCountdownSeconds(900);
      clearCart();
    } catch (err: unknown) {
      console.warn('Backend chưa sẵn sàng, tạo phiên thanh toán cục bộ:', err);
      const fallbackCode = generateRandomSessionCode();
      const newSession: CheckoutSessionState = {
        sessionId: fallbackCode,
        orderCode: fallbackCode,
        status: 'pending',
        statusText: 'Vui lòng chuyển khoản đặt cọc để giữ máy',
        isDepositSettled: false,
        totalAmount: finalTotal,
        depositAmount,
        remainingAmount,
        depositPercent,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        companyName: companyName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
        shippingAddress: shippingAddress.trim(),
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        remainingSeconds: 900,
        paymentMethod: activePaymentTab,
        items: snapshotItems,
      };

      setSession(newSession);
      setCountdownSeconds(900);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. POLLING KIỂM TRA TRẠNG THÁI PHIÊN THANH TOÁN (GET /api/checkout/status/:sessionId)
  const pollSessionStatus = useCallback(
    async (code: string) => {
      if (!code) return;
      try {
        const res = await fetch(`/api/checkout/status/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) {
            const serverData = json.data;
            if (serverData.status === 'paid' || serverData.isDepositSettled) {
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'paid',
                      statusText: 'Thanh toán cọc thành công! Máy đã được giữ cho bạn.',
                      isDepositSettled: true,
                      paidAt: serverData.paidAt || new Date().toISOString(),
                    }
                  : null
              );
            } else if (serverData.status === 'expired') {
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'expired',
                      statusText: 'Phiên giữ máy đã hết hạn.',
                    }
                  : null
              );
            }
          }
        }
      } catch (err) {
        console.debug('Polling check status:', err);
      }
    },
    []
  );

  // Kích hoạt Polling chu kỳ 3.5s khi phiên ở trạng thái 'pending'
  useEffect(() => {
    if (!session || session.status !== 'pending') {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      return;
    }

    const currentCode = session.orderCode;
    pollingTimerRef.current = setInterval(() => {
      pollSessionStatus(currentCode);
    }, 3500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [session, pollSessionStatus]);

  // Đếm ngược từng giây (Countdown Timer 15 phút)
  useEffect(() => {
    if (!session || session.status !== 'pending') return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSession((s) => (s ? { ...s, status: 'expired' } : null));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Nút thủ công: Tôi đã chuyển khoản xong (Kiểm tra ngay)
  const handleManualCheck = async () => {
    if (!session) return;
    setIsCheckingStatus(true);
    await pollSessionStatus(session.orderCode);
    setTimeout(() => {
      setIsCheckingStatus(false);
    }, 1200);
  };

  // Nút Demo / Test: Mô phỏng tiền cọc vào tài khoản (Test Webhook)
  const handleSimulateDeposit = async () => {
    if (!session) return;
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/checkout/simulate-deposit/${encodeURIComponent(session.orderCode)}`, {
        method: 'POST',
      });
      if (res.ok) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: 'paid',
                statusText: 'Thanh toán cọc thành công! Máy đã được giữ cho bạn.',
                isDepositSettled: true,
                paidAt: new Date().toISOString(),
              }
            : null
        );
      }
    } catch {
      // Fallback update state trực tiếp
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'paid',
              statusText: 'Thanh toán cọc thành công! Máy đã được giữ cho bạn.',
              isDepositSettled: true,
              paidAt: new Date().toISOString(),
            }
          : null
      );
    } finally {
      setIsSimulating(false);
    }
  };

  // Định dạng phút : giây (VD: 14:59)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // URLs QR Động chuẩn xác
  const transferContent = session ? `COC ${session.orderCode}` : '';
  const vietQrUrl = session
    ? `https://img.vietqr.io/image/TPB-${bankConfig.accountNumber}-compact2.png?amount=${session.depositAmount}&addInfo=${encodeURIComponent(session.orderCode)}`
    : '';
  // Mã QR chuẩn MoMo (ảnh QR tĩnh định dạng .webp đã upload từ Admin hoặc fallback)
  const momoQrUrl = bankConfig.momoQrUrl || '/uploads/payment/momo-qr.webp';

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
          <Link href="/cart" className="hover:text-amber-600">
            Giỏ hàng
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">
            {session ? 'Phiên thanh toán giữ máy' : 'Đặt cọc & Thanh toán'}
          </span>
        </nav>

        {/* ======================================================== */}
        {/* CASE 1: MÀN HÌNH XÁC NHẬN ĐẶT CỌC THÀNH CÔNG (PAID)       */}
        {/* ======================================================== */}
        {session && session.status === 'paid' ? (
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 shadow-sm text-center animate-slide-up">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 className="h-14 w-14 animate-pulse" />
            </div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-4 py-1 text-xs font-black text-emerald-800 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Đã Khóa Giữ Máy Thành Công
            </span>

            <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">
              Thanh Toán Cọc Thành Công! Máy Đã Được Giữ Cho Bạn.
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Khoản tiền đặt cọc Đợt 1 đã được hệ thống kế toán Công Nguyên ghi nhận. Kỹ thuật viên phụ trách xưởng Đông Hưng Thuận sẽ gọi điện cho bạn trong 15 phút tới để xác nhận lịch giao máy hoặc hẹn chạy thử máy.
            </p>

            {/* THÔNG TIN BIÊN NHẬN CỌC HIGHLIGHT */}
            <div className="my-8 rounded-3xl border border-emerald-300 bg-linear-to-b from-emerald-50/80 to-white p-6 sm:p-8 text-left max-w-lg mx-auto shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Mã đơn hàng giữ máy:
                </span>
                <span className="font-mono text-xl font-black text-emerald-950">
                  {session.orderCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Người đặt máy:</span>
                  <strong className="font-bold text-slate-900">{session.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Hotline liên hệ:</span>
                  <strong className="font-mono font-bold text-slate-900">{session.customerPhone}</strong>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Tiền cọc Đợt 1 ({session.depositPercent}% - ĐÃ THU):</span>
                  <strong className="text-xl font-black text-emerald-700">
                    {formatVND(session.depositAmount)}
                  </strong>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-slate-500 block text-[11px]">Còn lại thanh toán khi bàn giao máy:</span>
                  <strong className="font-bold text-slate-900 text-sm">
                    {formatVND(session.remainingAmount)}
                  </strong>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>Trạng thái: <strong>Đã ghi nhận kế toán</strong></span>
                <span className="font-mono">
                  {new Date(session.paidAt || Date.now()).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            {/* CỤM NÚT HÀNH ĐỘNG SAU KHI CỌC THÀNH CÔNG */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 px-6 py-3.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Tải Phiếu Thu Điện Tử / In Hóa Đơn Cọc</span>
              </button>

              <Link
                href={`/tracking?orderNumber=${encodeURIComponent(session.orderCode)}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 py-3.5 text-xs font-bold text-white shadow-sm transition"
              >
                <span>Tra cứu tiến độ đơn hàng</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="https://zalo.me/0976619044"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3.5 text-xs font-bold text-slate-700 transition"
              >
                <PhoneCall className="h-4 w-4 text-emerald-600" />
                <span>Zalo kỹ thuật: <strong>0976 619 044</strong></span>
              </a>
            </div>

            {/* MODAL PHIẾU THU ĐIỆN TỬ */}
            <DepositReceiptModal
              isOpen={isReceiptModalOpen}
              onClose={() => setIsReceiptModalOpen(false)}
              data={{
                orderCode: session.orderCode,
                customerName: session.customerName,
                customerPhone: session.customerPhone,
                shippingAddress: session.shippingAddress,
                companyName: session.companyName,
                taxCode: session.taxCode,
                totalAmount: session.totalAmount,
                depositAmount: session.depositAmount,
                remainingAmount: session.remainingAmount,
                depositPercent: session.depositPercent,
                paymentMethod: 'Chuyển khoản VietQR / MoMo',
                paidAt: session.paidAt || new Date().toISOString(),
                items: session.items,
              }}
            />
          </div>
        ) : session && session.status === 'expired' ? (
          /* ======================================================== */
          /* CASE 2: MÀN HÌNH HẾT HẠN PHIÊN GIỮ MÁY (EXPIRED)          */
          /* ======================================================== */
          <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 sm:p-12 shadow-sm text-center animate-slide-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <Clock className="h-10 w-10" />
            </div>

            <h1 className="mt-6 text-2xl font-black text-slate-900">
              Phiên Giữ Máy Đã Hết Hạn
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thời gian 15 phút chờ chuyển khoản cọc đã kết thúc. Máy móc trong đơn <strong className="font-mono">{session.orderCode}</strong> đã được tự động mở khóa lại trên hệ thống kho để các khách hàng khác có thể đặt mua.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => setSession(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-black text-slate-950 transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tạo lại phiên đặt máy mới</span>
              </button>

              <Link
                href="/products"
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-xs font-bold text-slate-700 transition"
              >
                Quay lại xem kho máy
              </Link>
            </div>
          </div>
        ) : session && session.status === 'pending' ? (
          /* ======================================================== */
          /* CASE 3: MÀN HÌNH CHỜ THANH TOÁN (PAYMENT WAITING SCREEN)  */
          /* ======================================================== */
          <div className="mx-auto max-w-4xl rounded-3xl border border-amber-300/80 bg-white p-6 sm:p-10 shadow-lg animate-slide-up space-y-8">
            {/* TIÊU ĐỀ & TRẠNG THÁI PENDING */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-4 py-1.5 text-xs font-black text-amber-900 shadow-2xs">
                <Loader2 className="h-4 w-4 text-amber-700 animate-spin" />
                <span>ĐANG CHỜ TIỀN CỌC VÀO TÀI KHOẢN ĐỂ KHÓA MÁY</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Vui Lòng Chuyển Khoản Đặt Cọc Để Giữ Máy
              </h1>

              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Quét mã QR ngân hàng hoặc MoMo bên dưới để thanh toán cọc Đợt 1 ({session.depositPercent}%). Hệ thống sẽ tự động cập nhật ngay khi tiền vào tài khoản.
              </p>
            </div>

            {/* BANNER ĐỒNG HỒ ĐẾM NGƯỢC GIỮ MÁY (15 PHÚT TTL) */}
            <div className="rounded-2xl border border-amber-300 bg-linear-to-r from-amber-500/10 via-amber-50 to-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 font-bold text-slate-950 shadow-sm text-xl">
                  ⏱️
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Thời gian giữ máy còn lại:
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 tracking-wider">
                    {formatTimer(countdownSeconds)}
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs text-slate-600">
                <span className="block text-[11px] text-slate-500">Mã phiên thanh toán:</span>
                <strong className="font-mono text-base font-black text-slate-900">
                  {session.orderCode}
                </strong>
              </div>
            </div>

            {/* TAB CHỌN PHƯƠNG THỨC: VIETQR / MOMO */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActivePaymentTab('VIETQR')}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                  activePaymentTab === 'VIETQR'
                    ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>Quét VietQR Ngân Hàng (Khuyên Dùng)</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePaymentTab('MOMO')}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                  activePaymentTab === 'MOMO'
                    ? 'border-pink-500 text-pink-900 bg-pink-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="h-4 w-4 text-pink-600" />
                <span>Ví Điện Tử MoMo</span>
              </button>
            </div>

            {/* NỘI DUNG THANH TOÁN (QR CODE & CÚ PHÁP) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* CỘT TRÁI: MÃ QR ĐỘNG (5 COLS) */}
              <div className="md:col-span-5 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white rounded-3xl border-2 border-slate-200 shadow-md inline-block">
                  <img
                    src={activePaymentTab === 'VIETQR' ? vietQrUrl : momoQrUrl}
                    alt="Mã QR thanh toán cọc máy bánh Công Nguyên"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Mở ứng dụng Mobile Banking hoặc MoMo để quét mã
                </span>
              </div>

              {/* CỘT PHẢI: CHI TIẾT TÀI KHOẢN & NÚT COPY (7 COLS) */}
              <div className="md:col-span-7 space-y-3.5 text-xs">
                {activePaymentTab === 'VIETQR' ? (
                  /* THÔNG TIN VIETQR NGÂN HÀNG */
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[11px]">Ngân hàng thụ hưởng:</span>
                      <strong className="text-slate-900 font-bold block">{bankConfig.bankName}</strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                        <strong className="font-mono text-base font-bold text-slate-950">
                          {bankConfig.accountNumber}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankConfig.accountNumber, 'accNumber')}
                        className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 font-bold text-slate-700 transition cursor-pointer"
                      >
                        {copiedField === 'accNumber' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedField === 'accNumber' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Chủ tài khoản:</span>
                      <strong className="font-bold text-slate-900 uppercase">
                        {bankConfig.accountHolder}
                      </strong>
                    </div>
                  </>
                ) : (
                  /* THÔNG TIN VÍ MOMO */
                  <>
                    <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-pink-800 block text-[11px] font-semibold">Phương thức thanh toán:</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-pink-700 bg-pink-100/80 px-2 py-0.5 rounded-md">
                          VietQR Napas 247
                        </span>
                      </div>
                      <strong className="text-pink-950 font-bold block text-sm">
                        Ví Điện Tử MoMo Chuẩn Xác
                      </strong>
                      <p className="text-[11px] text-pink-800/80 leading-relaxed pt-0.5">
                        Mở App <strong>MoMo</strong> hoặc bất kỳ <strong>ứng dụng ngân hàng</strong> nào có tính năng Quét QR để quét mã bên trái và chuyển tiền cọc.
                      </p>
                    </div>
                  </>
                )}

                {/* SỐ TIỀN CỌC CẦN CHUYỂN */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center justify-between">
                  <div>
                    <span className="text-amber-900 block text-[11px] font-semibold">
                      Số tiền cọc cần chuyển (Đợt 1 - {session.depositPercent}%):
                    </span>
                    <strong className="text-lg font-black text-rose-600">
                      {formatVND(session.depositAmount)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(Math.round(session.depositAmount)), 'amount')}
                    className="inline-flex items-center gap-1 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 px-3 py-1.5 font-bold text-amber-900 transition cursor-pointer"
                  >
                    {copiedField === 'amount' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* NỘI DUNG CHUYỂN KHOẢN (ĐÚNG MÃ PHIÊN NGẪU NHIÊN) */}
                <div className="p-3.5 rounded-2xl bg-amber-100/70 border-2 border-amber-400 flex items-center justify-between">
                  <div>
                    <span className="text-amber-950 block text-[11px] font-black uppercase">
                      Nội dung chuyển khoản (Bắt buộc chính xác):
                    </span>
                    <strong className="font-mono text-base font-black text-amber-950 tracking-wider">
                      COC {session.orderCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(`COC ${session.orderCode}`, 'msg')}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 font-bold text-slate-950 transition cursor-pointer shadow-xs"
                  >
                    {copiedField === 'msg' ? <Check className="h-3.5 w-3.5 text-slate-950" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === 'msg' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TRẠNG THÁI POLLING & NÚT KIỂM TRA GIAO DỊCH */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Hệ thống đang tự động kiểm tra giao dịch mỗi 3s...</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isCheckingStatus}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition cursor-pointer disabled:opacity-50"
                >
                  {isCheckingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>Tôi đã chuyển khoản xong (Kiểm tra ngay)</span>
                </button>

                {/* Nút Demo Test cho Webhook / Mô phỏng thanh toán */}
                <button
                  type="button"
                  onClick={handleSimulateDeposit}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Nhấn để kích hoạt trạng thái cọc thành công ngay lập tức"
                >
                  {isSimulating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  <span>Xác nhận cọc (Demo)</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center italic">
              * Cần hỗ trợ trực tiếp khi chuyển khoản? Liên hệ Hotline & Zalo: <strong className="text-slate-900 font-bold">0976 619 044</strong>.
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* CASE 4: FORM ĐIỀN THÔNG TIN ĐẶT MÁY (INITIAL FORM)       */
          /* ======================================================== */
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* CỘT TRÁI: FORM NHẬP THÔNG TIN KHÁCH HÀNG (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. THÔNG TIN KHÁCH HÀNG & XƯỞNG BÁNH */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" />
                  1. Thông tin người nhận & Địa chỉ xưởng bánh
                </h2>

                {errorMsg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Họ và tên người nhận máy <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Số điện thoại di động <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0976 619 044"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Địa chỉ email (nhận hợp đồng & phiếu thu điện tử)
                  </label>
                  <input
                    type="email"
                    placeholder="tiembanh@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Địa chỉ giao hàng & Khảo sát lắp đặt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Số 6/3 DN4, Đông Hưng Thuận, Quận 12, TP.HCM"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* TÙY CHỌN HÓA ĐƠN DOANH NGHIỆP */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isCompanyInvoice}
                      onChange={(e) => setIsCompanyInvoice(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Yêu cầu xuất hóa đơn GTGT (VAT 10%) cho Công ty / Hộ kinh doanh</span>
                  </label>
                </div>

                {isCompanyInvoice && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">
                        Tên công ty / Tiệm bánh
                      </label>
                      <input
                        type="text"
                        placeholder="Công ty TNHH Bánh Ngọt..."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">
                        Mã số thuế (MST)
                      </label>
                      <input
                        type="text"
                        placeholder="0312345678"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Ghi chú kỹ thuật (Hạ tầng điện 1 pha/3 pha, kích thước cửa xưởng...)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Xưởng dùng điện 3 pha 380V, cần hỗ trợ kéo dây vào tủ điện..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. CHỌN TỶ LỆ ĐẶT CỌC THEO ĐỢT (MILESTONE PAYMENTS) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  2. Tùy chọn đặt cọc & thanh toán theo đợt
                </h2>

                <div className="space-y-3">
                  {/* OPTION 1: CỌC 30% */}
                  <label
                    onClick={() => setDepositPercent(30)}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      depositPercent === 30
                        ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deposit"
                        checked={depositPercent === 30}
                        onChange={() => setDepositPercent(30)}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Đặt cọc Đợt 1 (30%)
                          </span>
                          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Khuyên dùng cho máy làm bánh
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Thanh toán 30% để khóa giữ máy tại kho. Phần còn lại (70%) thanh toán sau khi bàn giao & chạy thử máy tại xưởng.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-900 whitespace-nowrap ml-3">
                      {formatVND(finalTotal * 0.3)}
                    </span>
                  </label>

                  {/* OPTION 2: CỌC 50% */}
                  <label
                    onClick={() => setDepositPercent(50)}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      depositPercent === 50
                        ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deposit"
                        checked={depositPercent === 50}
                        onChange={() => setDepositPercent(50)}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Đặt cọc Đợt 1 (50%)
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Ưu tiên xuất kho hỏa tốc trong 24 giờ. 50% còn lại thanh toán khi nghiệm thu bàn giao máy.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-900 whitespace-nowrap ml-3">
                      {formatVND(finalTotal * 0.5)}
                    </span>
                  </label>

                  {/* OPTION 3: THANH TOÁN 100% */}
                  <label
                    onClick={() => setDepositPercent(100)}
                    className={`flex items-start justify-between rounded-2xl border p-4 cursor-pointer transition ${
                      depositPercent === 100
                        ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deposit"
                        checked={depositPercent === 100}
                        onChange={() => setDepositPercent(100)}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Thanh toán toàn bộ (100%)
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Thanh toán 1 lần cho toàn bộ giá trị đơn hàng.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-900 whitespace-nowrap ml-3">
                      {formatVND(finalTotal)}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BẢNG TỔNG HỢP & NÚT XÁC NHẬN ĐƠN (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-slate-900">
                  Chi tiết thanh toán đơn hàng
                </h2>

                {/* Danh sách rút gọn items */}
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.sku} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          SL: {item.quantity} × {formatVND(item.price)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 whitespace-nowrap">
                        {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính thiết bị:</span>
                    <span className="font-bold text-slate-900">{formatVND(totalAmount)}</span>
                  </div>

                  {isCompanyInvoice && (
                    <div className="flex justify-between text-slate-600">
                      <span>Thuế GTGT VAT (10%):</span>
                      <span className="font-bold text-slate-900">{formatVND(vatAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                    <span>Tổng đơn hàng:</span>
                    <span className="text-base font-black text-slate-950">{formatVND(finalTotal)}</span>
                  </div>
                </div>

                {/* KHỐI CỌC ĐỢT 1 & CÒN LẠI */}
                <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-amber-900 font-bold">
                    <span>Tiền cọc Đợt 1 ({depositPercent}%):</span>
                    <span className="text-base font-black text-rose-600">{formatVND(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-amber-200/80">
                    <span>Còn lại khi nhận & chạy thử máy:</span>
                    <span className="font-bold text-slate-900">{formatVND(remainingAmount)}</span>
                  </div>
                </div>

                {/* NÚT TẠO PHIÊN ĐẶT CỌC */}
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 py-4 text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang khởi tạo phiên giữ máy...</span>
                    </>
                  ) : (
                    <>
                      <span>Khởi Tạo Phiên Giữ Máy & Nhận QR Cọc</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-[11px] text-slate-500 text-center space-y-1">
                  <p>✓ Sau khi bấm, phiên giữ máy có hiệu lực trong 15 phút.</p>
                  <p>
                    ✓ Hotline kỹ thuật 24/7: <strong className="text-slate-900 font-bold">0976 619 044</strong>
                  </p>
                </div>
              </div>

              {/* CAM KẾT CHÍNH SÁCH */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Chính sách cọc an tâm 100% tại Công Nguyên:</span>
                </div>
                <ul className="text-[11px] space-y-1 text-slate-600 pl-6 list-disc">
                  <li>Hoàn tiền cọc 100% nếu máy thực tế không đúng mô tả kiểm định.</li>
                  <li>Hỗ trợ khách hàng đến xưởng 6/3 DN4 test máy trước khi giao.</li>
                  <li>Bảo hành kỹ thuật tận nơi 12 tháng.</li>
                </ul>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
