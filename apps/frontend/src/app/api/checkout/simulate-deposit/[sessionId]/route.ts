import { NextRequest, NextResponse } from 'next/server';
import { markCheckoutSessionPaid } from '@/lib/checkout-session-store';

export async function POST(
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
    const res = await fetch(`${baseUrl}/checkout/simulate-deposit/${cleanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      markCheckoutSessionPaid(cleanId);
      return NextResponse.json(json);
    }
  } catch {
    // Backend offline, fallback sang local store
  }

  // 2. Đánh dấu đã thanh toán cọc trong local store
  const updated = markCheckoutSessionPaid(cleanId);
  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Mô phỏng xác nhận đặt cọc thành công!',
  });
}
