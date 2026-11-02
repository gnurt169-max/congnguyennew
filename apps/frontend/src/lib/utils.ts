import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Liên hệ báo giá';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Liên hệ báo giá';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
}

/**
 * Chuẩn hóa số điện thoại di động Việt Nam:
 * - Loại bỏ toàn bộ khoảng trắng, dấu gạch nối (-), dấu chấm, ngoặc đơn
 * - Chuyển đổi định dạng quốc tế (+84 hoặc 84) về chuẩn số di động nội địa (bắt đầu bằng '0', ví dụ: '0976619044')
 * - Đảm bảo chuỗi 10 chữ số hợp lệ cho MoMo P2P và VietQR
 */
export function normalizeVietnamesePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Chuẩn hóa đường dẫn ảnh luôn bắt đầu bằng dấu gạch chéo (/),
 * tuyệt đối không ghép thêm bất kỳ domain hay port nào phía trước.
 * Loại bỏ triệt để các tiền tố localhost, 127.0.0.1 gây cảnh báo Private Network Access.
 */
export function normalizeImagePath(url?: string | null, fallback = '/placeholder-machine.svg'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // 1. Bóc tách đường dẫn relative /uploads/... nếu bị bọc bởi domain bất kỳ (localhost, IP hoặc VPS)
  const uploadMatch = trimmed.match(/\/uploads\/.+$/);
  if (uploadMatch) {
    return uploadMatch[0];
  }

  // 2. Nếu là URL tuyệt đối chứa localhost hoặc 127.0.0.1 thì cắt bỏ hoàn toàn domain
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    const withoutHost = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
    if (withoutHost.startsWith('/')) return withoutHost;
    return `/${withoutHost}`;
  }

  // 3. Nếu đã bắt đầu bằng dấu gạch chéo
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 4. Nếu là URL tuyệt đối bên ngoài (như VietQR Gateway hoặc CDN hợp lệ)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const match = trimmed.match(/https?:\/\/[^\/]+(\/.*)/);
    if (match && match[1].startsWith('/uploads/')) {
      return match[1];
    }
    return trimmed;
  }

  return `/${trimmed}`;
}

/**
 * Lấy Base URL của API Backend an toàn tuyệt đối:
 * - Trong môi trường Client (Browser):
 *   + Nếu đang chạy trên domain thật (không phải localhost/127.0.0.1), luôn dùng relative path '/api/v1'
 *   + Tuyệt đối không bao giờ trả về http://localhost:4000 hay http://127.0.0.1:4000 gây cảnh báo Private Network Access
 * - Trong môi trường Server (SSR / Server Component):
 *   + Sử dụng INTERNAL_API_URL hoặc BACKEND_API_URL trỏ đến 'http://127.0.0.1:4000/api/v1'
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return '/api/v1';
    }
    return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:4000/api/v1'
  );
}
