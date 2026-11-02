import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '8';

    const baseUrl =
      process.env.INTERNAL_API_URL ||
      process.env.BACKEND_API_URL ||
      'http://127.0.0.1:4000/api/v1';
    const res = await fetch(`${baseUrl}/products/recent?limit=${limit}`, {
      cache: 'no-store', // Cho phép refetch real-time khi có người bán đăng mới
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Không thể tải danh sách sản phẩm mới thanh lý' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Lỗi kết nối máy chủ' },
      { status: 500 }
    );
  }
}
