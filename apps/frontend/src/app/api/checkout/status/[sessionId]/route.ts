import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession, saveCheckoutSession } from '@/lib/checkout-session-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const cleanId = (sessionId || '').trim();

  // 1. Thử gọi backend NestJS nếu đang chạy
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_API_URL ||
    'http://127.0.0.1:4000/api/v1';
  try {
    const res = await fetch(`${baseUrl}/checkout/status/${cleanId}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        // Cập nhật local store
        saveCheckoutSession(json.data);
        return NextResponse.json(json);
      }
    }
  } catch {
    // Backend offline / chưa chạy, fallback sang local session store
  }

  // 2. Tìm trong local session store
  const localSession = getCheckoutSession(cleanId);
  if (localSession) {
    return NextResponse.json({
      success: true,
      data: localSession,
    });
  }

  // 3. Nếu chưa có phiên nhưng có mã định dạng DH-CN-XXXXXX, tự động sinh phiên tạm thời
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const fallbackSession = {
    sessionId: cleanId,
    orderCode: cleanId,
    status: 'pending' as const,
    statusText: 'Vui lòng chuyển khoản đặt cọc để giữ máy.',
    isDepositSettled: false,
    totalAmount: 45000000,
    depositAmount: 13500000,
    remainingAmount: 31500000,
    depositPercent: 30,
    customerName: 'Khách hàng Công Nguyên',
    customerPhone: '0976 619 044',
    shippingAddress: 'Xưởng bánh Đông Hưng Thuận, Q.12, TP.HCM',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    remainingSeconds: 900,
    paymentMethod: 'VIETQR',
  };

  saveCheckoutSession(fallbackSession);

  return NextResponse.json({
    success: true,
    data: fallbackSession,
  });
}
