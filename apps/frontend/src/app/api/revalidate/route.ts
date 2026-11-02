import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

const EXPECTED_SECRET = process.env.REVALIDATE_SECRET_TOKEN || 'cong_nguyen_isr_secret_token_2026';

/**
 * POST /api/revalidate
 * On-Demand Revalidation: Làm mới cache tức thì theo tag hoặc theo path
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const secretHeader = request.headers.get('x-revalidate-secret');
    const querySecret = url.searchParams.get('secret');

    const body = await request.json().catch(() => ({}));
    const bodySecret = body?.secret;

    const providedSecret = authHeader || secretHeader || querySecret || bodySecret;

    // Kiểm tra bảo mật: chấp nhận nếu có secret hợp lệ HOẶC gọi từ localhost nội bộ
    const host = request.headers.get('host') || '';
    const isLocalInternal = host.includes('localhost') || host.includes('127.0.0.1');

    if (!isLocalInternal && providedSecret !== EXPECTED_SECRET) {
      return NextResponse.json(
        { revalidated: false, message: 'Mã bí mật xác thực revalidation không hợp lệ hoặc bị thiếu' },
        { status: 401 },
      );
    }

    const tag = body?.tag || url.searchParams.get('tag');
    const path = body?.path || url.searchParams.get('path');
    const slug = body?.slug || url.searchParams.get('slug');

    // Luôn làm mới các cache cốt lõi của danh sách sản phẩm, navigation menu và layout trang chủ
    revalidateTag('products');
    revalidateTag('products-list');
    revalidateTag('navigation');
    revalidateTag('menu-header');
    revalidateTag('navigation-config');
    revalidateTag('homepage-config');
    revalidatePath('/', 'layout');
    revalidatePath('/products');
    revalidatePath('/san-pham');

    if (slug) {
      revalidatePath(`/products/${slug}`);
      revalidatePath(`/san-pham/${slug}`);
      revalidateTag(`product-${slug}`);
    }

    if (tag && tag !== 'products' && tag !== 'products-list') {
      revalidateTag(tag);
    }

    if (path && path !== '/products' && path !== '/san-pham') {
      revalidatePath(path);
    }

    return NextResponse.json({
      revalidated: true,
      tag: tag || 'products',
      path: path || '/products',
      slug: slug || null,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { revalidated: false, error: err.message || 'Lỗi xử lý on-demand revalidation' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/revalidate?secret=...&tag=...&path=...&slug=...
 * Tiện ích làm mới cache nhanh qua thanh địa chỉ trình duyệt hoặc webhook
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-revalidate-secret');
  const host = request.headers.get('host') || '';
  const isLocalInternal = host.includes('localhost') || host.includes('127.0.0.1');

  if (!isLocalInternal && secret !== EXPECTED_SECRET) {
    return NextResponse.json(
      { revalidated: false, message: 'Mã bí mật xác thực revalidation không hợp lệ hoặc bị thiếu' },
      { status: 401 },
    );
  }

  const tag = url.searchParams.get('tag');
  const path = url.searchParams.get('path') || '/';
  const slug = url.searchParams.get('slug');

  try {
    revalidateTag('products');
    revalidateTag('products-list');
    revalidatePath('/', 'layout');
    revalidatePath('/products');
    revalidatePath('/san-pham');

    if (slug) {
      revalidatePath(`/products/${slug}`);
      revalidatePath(`/san-pham/${slug}`);
      revalidateTag(`product-${slug}`);
    }

    if (tag) revalidateTag(tag);
    if (path) revalidatePath(path);

    return NextResponse.json({ revalidated: true, tag: tag || 'products', path, slug: slug || null, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ revalidated: false, error: err.message }, { status: 500 });
  }
}
