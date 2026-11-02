/**
 * Helper kích hoạt On-Demand Revalidation từ Client Side (Admin CMS)
 * Gửi yêu cầu giải phóng cache tức thì tới API /api/revalidate của Next.js
 */
export async function triggerRevalidation(options: {
  tag?: string;
  path?: string;
}): Promise<boolean> {
  try {
    const secret =
      process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN || 'cong_nguyen_isr_secret_token_2026';

    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({
        ...options,
        secret,
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      console.log('[On-Demand ISR] Đã làm mới cache thành công:', options, data);
      return true;
    } else {
      console.warn('[On-Demand ISR] Revalidation phản hồi mã lỗi:', res.status);
      return false;
    }
  } catch (err) {
    console.warn('[On-Demand ISR] Không thể gửi yêu cầu revalidation:', err);
    return false;
  }
}

