import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  const isAdminApiRoute = pathname.startsWith('/api/admin');

  if (isAdminRoute || isAdminApiRoute) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const userRole = request.cookies.get('user_role')?.value;
    const authHeader = request.headers.get('authorization');

    const hasValidToken =
      Boolean(adminToken) ||
      (userRole === 'ADMIN' && Boolean(request.cookies.get('customer_token')?.value)) ||
      (authHeader && authHeader.startsWith('Bearer '));

    // 1. Chặn request API không có xác thực hợp lệ
    if (isAdminApiRoute && !hasValidToken) {
      const apiResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED_ADMIN_ACCESS',
            message: 'Yêu cầu quyền quản trị viên hợp lệ để truy cập endpoint này.',
          },
        },
        { status: 401 },
      );
      apiResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return apiResponse;
    }

    // 2. Chặn request giao diện quản trị chưa đăng nhập -> Chuyển hướng 302 về /login
    if (isAdminRoute && !hasValidToken) {
      const loginUrl = new URL(
        `/login?redirect=${encodeURIComponent(pathname)}`,
        request.url,
      );
      const redirectResponse = NextResponse.redirect(loginUrl, 302);
      redirectResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      return redirectResponse;
    }

    // 3. Nếu đã xác thực hợp lệ nhưng truy cập route admin, luôn gắn header cấm bot index
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
