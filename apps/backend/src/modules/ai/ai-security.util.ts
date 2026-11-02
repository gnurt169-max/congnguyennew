import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const PRIMARY_SECRET = process.env.JWT_SECRET || 'industrial_bakery_secret_key_2026';
const FALLBACK_SECRET = 'cong_nguyen_gemini_ai_secret_key_2026';

const PRIMARY_KEY = crypto.createHash('sha256').update(PRIMARY_SECRET).digest();
const FALLBACK_KEY = crypto.createHash('sha256').update(FALLBACK_SECRET).digest();

/**
 * Mã hóa API Key trước khi lưu vào Database (AES-256-CBC)
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || !plainText.trim()) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, PRIMARY_KEY, iv);
  let encrypted = cipher.update(plainText.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Giải mã API Key từ Database khi Backend cần sử dụng gọi Gemini API
 */
export function decryptApiKey(cipherText: string | null | undefined): string {
  if (!cipherText || !cipherText.trim()) return '';
  if (!cipherText.includes(':')) {
    return cipherText.trim();
  }

  const [ivHex, encrypted] = cipherText.split(':');
  if (!ivHex || !encrypted) return '';

  // 1. Thử giải mã với khóa chính (PRIMARY_KEY)
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, PRIMARY_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    if (decrypted && decrypted.trim().length > 0) {
      return decrypted.trim();
    }
  } catch {
    // Tiếp tục fallback bên dưới
  }

  // 2. Thử giải mã với khóa phụ (FALLBACK_KEY) nếu secret đổi
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, FALLBACK_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    if (decrypted && decrypted.trim().length > 0) {
      return decrypted.trim();
    }
  } catch {
    // Không thể giải mã
  }

  return '';
}

/**
 * Che giấu một phần API Key để hiển thị an toàn trên giao diện Admin
 * Tuyệt đối KHÔNG BAO GIỜ trả chuỗi mã hóa thô (AQ.Ab8RN...) về phía client
 * Hiển thị 4 ký tự đầu và 4 ký tự cuối, ở giữa là dấu chấm bảo mật
 * Chấp nhận mọi định dạng Key (AIza..., AQ..., v.v.), không ràng buộc tiền tố
 */
export function maskApiKey(key: string | null | undefined): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();

  if (trimmed.length <= 8) {
    return '••••••••••••';
  }

  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}
