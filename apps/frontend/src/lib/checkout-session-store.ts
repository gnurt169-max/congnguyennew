export interface CheckoutSessionRecord {
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
  shippingAddress: string;
  createdAt: string;
  expiresAt: string;
  remainingSeconds: number;
  paymentMethod: string;
  paidAt?: string | null;
  items?: Array<{
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

// In-memory global store trên Node runtime của Next.js
declare global {
  // eslint-disable-next-line no-var
  var __CHECKOUT_SESSIONS__: Map<string, CheckoutSessionRecord> | undefined;
}

const sessionsMap: Map<string, CheckoutSessionRecord> =
  globalThis.__CHECKOUT_SESSIONS__ || new Map<string, CheckoutSessionRecord>();
globalThis.__CHECKOUT_SESSIONS__ = sessionsMap;

export function saveCheckoutSession(session: CheckoutSessionRecord): CheckoutSessionRecord {
  sessionsMap.set(session.sessionId, session);
  sessionsMap.set(session.orderCode, session);
  return session;
}

export function getCheckoutSession(idOrCode: string): CheckoutSessionRecord | null {
  const clean = idOrCode.trim();
  const session = sessionsMap.get(clean);
  if (!session) return null;

  const now = Date.now();
  const exp = new Date(session.expiresAt).getTime();
  const remainingSeconds = Math.max(0, Math.floor((exp - now) / 1000));

  if (session.status === 'pending' && remainingSeconds <= 0) {
    session.status = 'expired';
    session.statusText = 'Phiên giữ máy đã hết hạn do chưa nhận được cọc. Máy đã được mở lại cho khách hàng khác.';
  }

  session.remainingSeconds = remainingSeconds;
  return session;
}

export function markCheckoutSessionPaid(idOrCode: string): CheckoutSessionRecord | null {
  const session = getCheckoutSession(idOrCode);
  if (!session) return null;

  session.status = 'paid';
  session.statusText = 'Thanh toán cọc thành công! Máy đã được giữ cho bạn.';
  session.isDepositSettled = true;
  session.paidAt = new Date().toISOString();
  saveCheckoutSession(session);
  return session;
}
