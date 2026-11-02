import { getApiBaseUrl } from './utils';
import { ApiResponse } from '@industrial-bakery/shared-types';

/**
 * Lấy cookie theo tên
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Lấy token xác thực quản trị viên từ localStorage hoặc cookie
 * Thứ tự ưu tiên: admin_token > token > customer_token > cookies > dev_admin_token_2026
 */
export function getAdminToken(): string {
  if (typeof window === 'undefined') {
    return 'dev_admin_token_2026';
  }

  const token =
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('customer_token') ||
    getCookie('admin_token') ||
    getCookie('customer_token');

  return token || 'dev_admin_token_2026';
}

/**
 * Xóa toàn bộ token và cookie khi phiên làm việc hết hạn hoặc bị từ chối 401/403
 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('auth_token');

  // Xóa sạch cookie tương ứng
  const expiredCookie = '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = `admin_token${expiredCookie}`;
  document.cookie = `customer_token${expiredCookie}`;
  document.cookie = `token${expiredCookie}`;
  document.cookie = `auth_token${expiredCookie}`;
  document.cookie = `user_role${expiredCookie}`;
}

/**
 * Fetch client tự động đính kèm Bearer token và xử lý phân quyền 401/403 cho Admin
 */
export async function fetchWithAdminAuth(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAdminToken();

  // Log debug token theo yêu cầu
  console.log('Sending token:', token ? `${token.slice(0, 20)}... (length: ${token.length})` : 'No token found');

  const headers = new Headers(init.headers || {});

  // Gắn header Authorization nếu chưa có
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Chuẩn hóa Content-Type:
  // - Nếu là FormData, TUYỆT ĐỐI XÓA BỎ Content-Type để trình duyệt tự tạo boundary cho multipart/form-data
  // - Nếu có body và không phải FormData thì mặc định là application/json
  if (init.body instanceof FormData) {
    headers.delete('Content-Type');
  } else if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Chuẩn hóa URL an toàn trên Production:
  // - Cắt bỏ hoàn toàn domain cục bộ localhost:4000 hoặc 127.0.0.1:4000
  // - Loại bỏ triệt để nhân đôi tiền tố /api/v1/api/v1
  // - Đảm bảo URL bắt đầu bằng Relative Path /api/v1/...
  let finalInput = input;
  if (typeof finalInput === 'string') {
    let cleanUrl = finalInput.replace(/^https?:\/\/(localhost|127\.0\.0\.1):4000/i, '');

    while (cleanUrl.includes('/api/v1/api/v1')) {
      cleanUrl = cleanUrl.replace('/api/v1/api/v1', '/api/v1');
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = `/${cleanUrl}`;
      }
      if (!cleanUrl.startsWith('/api/')) {
        cleanUrl = `/api/v1${cleanUrl}`;
      }
    }

    while (cleanUrl.includes('/api/v1/api/v1')) {
      cleanUrl = cleanUrl.replace('/api/v1/api/v1', '/api/v1');
    }

    finalInput = cleanUrl;
  }

  try {
    const response = await fetch(finalInput, {
      ...init,
      headers,
    });

    // Xử lý khi Backend trả về mã lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
    if (response.status === 401 || response.status === 403) {
      console.warn(
        `[AdminAuthGuard] Yêu cầu ${typeof input === 'string' ? input : 'API'} bị từ chối (HTTP ${response.status}). Tiến hành xóa token và điều hướng về trang đăng nhập...`
      );

      clearAuthTokens();

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Tránh loop nếu đang ở trang login
        if (!currentPath.includes('/login')) {
          window.location.href = `/login?reason=expired&redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return response;
  } catch (error) {
    console.error('[AdminAuthGuard] Lỗi kết nối khi gửi request admin:', error);
    throw error;
  }
}

/**
 * Wrapper gọi API trả về dữ liệu chuẩn ApiResponse<T>
 */
export async function fetchAdminApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  let cleanEndpoint = endpoint.replace(/^https?:\/\/(localhost|127\.0\.0\.1):4000/i, '');
  while (cleanEndpoint.includes('/api/v1/api/v1')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1/api/v1', '/api/v1');
  }
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/v1/', '/');
  } else if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace('/api/', '/');
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;

  const response = await fetchWithAdminAuth(url, options);
  const data: ApiResponse<T> = await response.json();

  if (!response.ok && !data.error) {
    throw new Error(`HTTP ${response.status}: Yêu cầu quản trị không thành công`);
  }

  return data;
}

/**
 * Object `api` / `adminApi` chuẩn hóa các phương thức GET, POST, PUT, PATCH, DELETE
 * Tự động gắn Token, loại bỏ nguy cơ trùng lặp tiền tố /api/v1
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchAdminApi<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchAdminApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchAdminApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchAdminApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    fetchAdminApi<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const adminApi = api;

