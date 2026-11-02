import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Giới hạn file tối đa 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const backendBaseUrl =
      process.env.INTERNAL_API_URL ||
      process.env.BACKEND_API_URL ||
      'http://127.0.0.1:4000/api/v1';

    // 1. Trường hợp gửi Multipart FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, message: 'Vui lòng chọn file hình ảnh' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: 'Dung lượng ảnh vượt quá giới hạn 20MB. Vui lòng nén hoặc chọn ảnh nhỏ hơn.' },
          { status: 400 },
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: 'Định dạng file không hỗ trợ. Vui lòng chỉ tải ảnh (JPG, PNG, WebP).' },
          { status: 400 },
        );
      }

      // Ủy quyền cho Backend NestJS xử lý tối ưu hoá và nén WebP với Sharp
      try {
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        const bRes = await fetch(`${backendBaseUrl}/upload`, {
          method: 'POST',
          body: backendFormData,
        });

        if (bRes.ok) {
          const bData = await bRes.json();
          const finalData = bData.data || bData;
          return NextResponse.json({
            success: true,
            url: finalData.url,
            filename: finalData.fileName || finalData.filename,
            size: finalData.optimizedSize || finalData.size,
            savedPercent: finalData.savedPercent,
            format: 'webp',
          });
        }
      } catch (err) {
        console.warn('Backend upload forwarding error, falling back to local write:', err);
      }

      // Fallback cục bộ nếu backend tạm thời không phản hồi
      const buffer = Buffer.from(await file.arrayBuffer());
      const isPayment = file.name.toLowerCase().includes('momo') || file.name.toLowerCase().includes('vietqr') || file.name.toLowerCase().includes('qr');
      const subFolder = isPayment ? 'payment' : 'products';
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
      }

      const ext = path.extname(file.name) || '.webp';
      const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${Date.now()}-${cleanName}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer, { mode: 0o644 });

      // Lưu thêm bản sao tại public/uploads để tương thích
      try {
        const rootUploads = path.join(process.cwd(), 'public', 'uploads');
        fs.writeFileSync(path.join(rootUploads, filename), buffer, { mode: 0o644 });
      } catch {}

      return NextResponse.json({
        success: true,
        url: `/uploads/${subFolder}/${filename}`,
        filename,
        size: file.size,
      });
    }

    // 2. Trường hợp gửi JSON Base64
    const body = await req.json();
    const { imageBase64, filename: originalName } = body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ success: false, message: 'Dữ liệu ảnh không hợp lệ' }, { status: 400 });
    }

    // Chuyển tiếp sang Backend NestJS để xử lý qua Sharp
    try {
      const bRes = await fetch(`${backendBaseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          filename: originalName,
        }),
      });

      if (bRes.ok) {
        const bData = await bRes.json();
        const finalData = bData.data || bData;
        return NextResponse.json({
          success: true,
          url: finalData.url,
          filename: finalData.fileName || finalData.filename,
          size: finalData.optimizedSize || finalData.size,
          savedPercent: finalData.savedPercent,
          format: 'webp',
        });
      }
    } catch (err) {
      console.warn('Backend base64 upload error, falling back:', err);
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = '.png';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        return NextResponse.json(
          { success: false, message: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.' },
          { status: 400 },
        );
      }
      buffer = Buffer.from(matches[2], 'base64');
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Ảnh quá lớn (tối đa 20MB). Vui lòng chọn ảnh dung lượng nhỏ hơn.' },
        { status: 400 },
      );
    }

    const safeBase = (originalName || 'uploaded-machine').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isPayment = safeBase.toLowerCase().includes('momo') || safeBase.toLowerCase().includes('vietqr') || safeBase.toLowerCase().includes('qr');
    const subFolder = isPayment ? 'payment' : 'products';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    }

    const filename = `${Date.now()}-${safeBase}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer, { mode: 0o644 });

    try {
      const rootUploads = path.join(process.cwd(), 'public', 'uploads');
      fs.writeFileSync(path.join(rootUploads, filename), buffer, { mode: 0o644 });
    } catch {}

    return NextResponse.json({
      success: true,
      url: `/uploads/${subFolder}/${filename}`,
      filename,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi tải ảnh: ' + (error?.message || 'Không xác định') },
      { status: 500 },
    );
  }
}
