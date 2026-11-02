import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from './ai-security.util';
import {
  UpdateGeminiSettingsDto,
  TestGeminiKeyDto,
  AiChatDto,
} from './dto/gemini-settings.dto';

const DEFAULT_WELCOME_MESSAGE =
  'Chào bạn! Công Nguyên chuyên cung cấp & thanh lý máy móc, thiết bị làm bánh công nghiệp (lò nướng, máy trộn bột, máy cán, máy chia bột...). Bạn đang cần tư vấn dòng máy nào hoặc tìm đồ tân trang cho tiệm bánh của mình?';

const DEFAULT_WIDGET_ROLE = 'Chuyên Viên Kỹ Thuật & Báo Giá Máy Bánh Công Nguyên';

const DEFAULT_SYSTEM_PROMPT =
  'Bạn là Chuyên viên Kỹ thuật & Báo Giá Thiết Bị Bánh của CÔNG NGUYÊN (Website: congnguyen.com.vn) - đơn vị chuyên mua bán, tân trang, thanh lý máy móc và dây chuyền làm bánh công nghiệp thực tế. Nhiệm vụ của bạn là:\n- Tư vấn thông số kỹ thuật, công suất và ứng dụng thực tế của 3 nhóm danh mục thiết bị làm bánh chuẩn của Công Nguyên:\n  1. Tủ trưng bày bánh kem & Bảo quản (slug: tu-trung-bay-banh)\n  2. Lò nướng bánh công nghiệp (slug: lo-nuong-cong-nghiep)\n  3. Máy trộn bột & Đánh trứng (slug: may-tron-bot-danh-trung)\n- KHO HÀNG THỰC TẾ & KHÓA CHẶT DỮ LIỆU (STRICT PRODUCT GROUNDING):\n  + Bạn ghi nhớ chính xác và CHỈ gợi ý, báo giá những sản phẩm máy làm bánh thanh lý & tân trang CÒN HÀNG TRONG KHO (stock > 0).\n  + Danh sách máy đang có sẵn tại kho Công Nguyên:\n    1. "Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 97.000.000 đ | Giá bán ưu đãi: 45.000.000 đ (Tiết kiệm 52.000.000 đ) | Tồn kho: 1 | Tình trạng: Tân trang nguyên bản\n    2. "Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 118.000.000 đ | Giá bán ưu đãi: 55.000.000 đ (Tiết kiệm 63.000.000 đ) | Tồn kho: 3 (Còn 3 con: 2 màu đen, 1 màu kem) | Tình trạng: Máy tân trang như mới\n    3. "Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 58.000.000 đ | Giá bán ưu đãi: 38.000.000 đ (Tiết kiệm 20.000.000 đ) | Tồn kho: 1 | Tình trạng: Nguyên bản hoạt động hoàn hảo\n    4. "Tủ bảo quản 2 cánh mở Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 38.000.000 đ | Giá bán ưu đãi: 24.000.000 đ (Tiết kiệm 14.000.000 đ) | Tồn kho: 1 | Tình trạng: Tân trang đạt chuẩn kỹ thuật\n    5. "Cối đánh trứng / Trộn bột Đài Loan Hobat" | Danh mục: Máy trộn bột & Đánh trứng (may-tron-bot-danh-trung) | Thương hiệu: Hobat (Đài Loan) | Giá gốc: 24.500.000 đ | Giá bán ưu đãi: 16.000.000 đ (Tiết kiệm 8.500.000 đ) | Tồn kho: 1 | Tình trạng: Máy nguyên bản, motor dây đồng cực khỏe\n    6. "Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Hewwu (Trung Quốc) | Giá gốc: 10.500.000 đ | Giá bán ưu đãi: 7.000.000 đ (Tiết kiệm 3.500.000 đ) | Tồn kho: 1 | Tình trạng: Thanh lý tiệm bánh, nhiệt lên đều\n    7. "Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Trung Quốc | Giá gốc: 18.000.000 đ | Giá bán ưu đãi: 10.000.000 đ (Tiết kiệm 8.000.000 đ) | Tồn kho: 1 | Tình trạng: Hàng mới 100% xả thanh lý kho\n    8. "Lò nướng đối lưu Southstar 4 mâm" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Southstar | Giá gốc: 35.000.000 đ | Giá bán ưu đãi: 25.000.000 đ (Tiết kiệm 10.000.000 đ) | Tồn kho: 1 | Tình trạng: Độ mới 90%\n- QUY TẮC ĐỒNG BỘ TỒN KHO & XỬ LÝ MÁY HẾT HÀNG (REAL-TIME STOCK & OUT-OF-STOCK RULES):\n  + CHỈ gợi ý và báo giá các dòng máy có stock > 0.\n  + NẾU khách hỏi máy đã hết (stock === 0 hoặc out_of_stock), AI BẮT BUỘC thông báo lịch sự đúng nguyên văn: \"Dòng máy này hiện kho vừa chốt cọc cho khách, bạn có thể để lại số Zalo để kỹ thuật viên báo ngay khi đợt máy tân trang tiếp theo hoàn thiện nhé!\". Sau đó mời khách để lại số hoặc kết bạn Zalo 0976 619 044.\n- QUY TẮC SO SÁNH GIÁ & TIẾT KIỆM KHI BÁO GIÁ: Khi khách hỏi giá bất kỳ máy nào, bot KHÔNG CHỈ báo giá thanh lý mà BẮT BUỘC PHẢI NHẤN MẠNH SỐ TIỀN TIẾT KIỆM so với mua mới trên thị trường. Ví dụ: \"Tủ bánh kem 1m5 5 tầng Ruyshing giá mới trên thị trường khoảng 97 triệu, bên mình thanh lý máy tân trang chỉ 45 triệu, bạn tiết kiệm được tận 52 triệu cho tiệm của mình. Bạn có muốn kỹ thuật viên gửi video quay test máy qua Zalo 0976 619 044 không ạ?\". Đồng thời nêu 3 cam kết an tâm: Bảo hành kỹ thuật tận nơi, đổi trả 7 ngày nếu lỗi kỹ thuật, và hỗ trợ test máy trực tiếp tại xưởng 6/3 DN4, Đông Hưng Thuận.\n- THÔNG TIN LIÊN HỆ KỸ THUẬT & ZALO: Khi khách hàng yêu cầu gặp tư vấn viên, liên hệ kỹ thuật trực tiếp, hoặc xin số Zalo để gửi hình ảnh/video máy cũ cần bán thanh lý hay tân trang, bạn hãy cung cấp số Hotline & Zalo chính thức duy nhất là 0976 619 044 (link chat Zalo: https://zalo.me/0976619044) để được kỹ sư trưởng Công Nguyên thẩm định và hỗ trợ ngay.\n- Khi khách hàng hỏi mua hoặc tư vấn bất kỳ dòng máy nào, hãy nêu rõ tình trạng máy, xuất xứ, mức giá ưu đãi so với giá gốc, và kích thích khách hàng bấm nút \"Báo giá (RFQ)\" để nhận khảo sát điện 3 pha hoặc hỗ trợ vận chuyển lắp đặt tận nơi.\n- Tuyệt đối KHÔNG trả lời về sách, tài liệu học tập, giáo trình sinh viên, máy tính cũ. Luôn giữ văn phong kỹ thuật, am hiểu ngành bánh và tôn trọng khách hàng.';

const FALLBACK_IN_STOCK_PRODUCTS = [
  {
    id: 'prod-ruyshing-1m5-5t',
    name: 'Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m5-5-tang-ruyshing-dai-loan',
    basePrice: 45000000,
    originalPrice: 97000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Tân trang nguyên bản',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    summary: 'Tủ bánh kem kính đứng 1m5 gồm 5 tầng trưng bày, sấy kính chống đọng sương, block làm lạnh nhập khẩu Đài Loan chạy cực êm và bền bỉ.',
    brand: 'Ruyshing (Đài Loan)',
  },
  {
    id: 'prod-ruyshing-1m8-5t',
    name: 'Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan',
    slug: 'tu-trung-bay-banh-kem-1m8-5-tang-ruyshing-dai-loan',
    basePrice: 55000000,
    originalPrice: 118000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Máy tân trang như mới',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 3,
    soldCount: 0,
    note: 'Còn 3 con: 2 màu đen, 1 màu kem',
    thumbnail: null,
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    summary: 'Dòng tủ lớn 1m8 cao cấp 5 tầng kính đứng, dung tích rộng rãi, sấy kính 4 mặt, phù hợp tiệm bánh quy mô lớn.',
    brand: 'Ruyshing (Đài Loan)',
  },
  {
    id: 'prod-ruyshing-2canh-lua',
    name: 'Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan',
    slug: 'tu-mat-bao-quan-2-canh-lua-ruyshing-dai-loan',
    basePrice: 38000000,
    originalPrice: 58000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Nguyên bản hoạt động hoàn hảo',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    summary: 'Tủ mát công nghiệp 2 cánh lùa tiện lợi, tối ưu diện tích thao tác trong quầy, dàn lạnh đồng siêu bền.',
    brand: 'Ruyshing (Đài Loan)',
  },
  {
    id: 'prod-ruyshing-2canh-mo',
    name: 'Tủ bảo quản 2 cánh mở Ruyshing Đài Loan',
    slug: 'tu-bao-quan-2-canh-mo-ruyshing-dai-loan',
    basePrice: 24000000,
    originalPrice: 38000000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Tân trang đạt chuẩn kỹ thuật',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-tu-trung-bay', name: 'Tủ trưng bày bánh kem & Bảo quản', slug: 'tu-trung-bay-banh' },
    summary: 'Tủ 2 cánh mở bảo quản cốt bánh và nguyên liệu bánh, nhiệt độ giữ ẩm ổn định.',
    brand: 'Ruyshing (Đài Loan)',
  },
  {
    id: 'prod-hobat-mixer',
    name: 'Cối đánh trứng / Trộn bột Đài Loan Hobat',
    slug: 'coi-danh-trung-tron-bot-dai-loan-hobat',
    basePrice: 16000000,
    originalPrice: 24500000,
    condition: 'REFURBISHED_FULL',
    refurbishDetails: 'Máy nguyên bản, motor dây đồng cực khỏe',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-may-tron-bot', name: 'Máy trộn bột & Đánh trứng', slug: 'may-tron-bot-danh-trung' },
    summary: 'Cối đánh trứng và nhào bột công nghiệp bền bỉ của Hobat, đa tốc độ đánh kem, đánh trứng bông mịn.',
    brand: 'Hobat (Đài Loan)',
  },
  {
    id: 'prod-hewwu-oven',
    name: 'Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc',
    slug: 'lo-nuong-dien-1-tang-2-khay-hewwu-trung-quoc',
    basePrice: 7000000,
    originalPrice: 10500000,
    condition: 'FAIR_80',
    refurbishDetails: 'Thanh lý tiệm bánh, nhiệt lên đều',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    summary: 'Lò nướng tầng điện thương hiệu Hewwu, 2 mặt lửa trên dưới tùy chỉnh độc lập, thích hợp nướng bánh bông lan, bánh trung thu, bánh mì.',
    brand: 'Hewwu (Trung Quốc)',
  },
  {
    id: 'prod-convection-4tray-new',
    name: 'Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)',
    slug: 'lo-nuong-doi-luu-4-mam-trung-quoc-moi-100',
    basePrice: 10000000,
    originalPrice: 18000000,
    condition: 'LIKE_NEW_99',
    refurbishDetails: 'Hàng mới 100% xả thanh lý kho',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    summary: 'Lò nướng đối lưu 4 khay mới tinh chưa qua sử dụng, có quạt gió tuần hoàn giúp vỏ bánh chín vàng đều màu, xả kho giá sốc.',
    brand: 'Trung Quốc',
  },
  {
    id: 'prod-southstar-4tray-90',
    name: 'Lò nướng đối lưu Southstar 4 mâm',
    slug: 'lo-nuong-doi-luu-southstar-4-mam',
    basePrice: 25000000,
    originalPrice: 35000000,
    condition: 'EXCELLENT_90_95',
    refurbishDetails: 'Độ mới 90%',
    availability: 'AVAILABLE',
    status: 'available',
    stock: 1,
    soldCount: 0,
    thumbnail: null,
    category: { id: 'cat-lo-nuong', name: 'Lò nướng bánh công nghiệp', slug: 'lo-nuong-cong-nghiep' },
    summary: 'Lò nướng đối lưu 4 mâm thương hiệu nổi tiếng Southstar, có chế độ phun sương tạo ẩm, vỏ máy inox sáng đẹp, mới 90%.',
    brand: 'Southstar',
  },
];

const GEMINI_MODEL = 'gemini-2.5-flash';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cài đặt hệ thống AI trong Database, nếu chưa có thì khởi tạo bản ghi mặc định
   * Tự động làm sạch dữ liệu UniPass cũ nếu còn sót lại trong DB
   */
  async getOrCreateSystemSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: 'default',
          geminiApiKey: null,
          isAiEnabled: true,
          aiModelName: GEMINI_MODEL,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          welcomeMessage: DEFAULT_WELCOME_MESSAGE,
        },
      });
    } else {
      // Dọn dẹp triệt để dữ liệu cũ (UniPass hoặc sinh viên/giáo trình) nếu trong DB còn lưu
      const hasStalePrompt =
        settings.systemPrompt &&
        (settings.systemPrompt.includes('UniPass') ||
          settings.systemPrompt.includes('định hướng học tập') ||
          settings.systemPrompt.includes('hướng nghiệp') ||
          settings.systemPrompt.includes('học tập') ||
          settings.systemPrompt.includes('sinh viên') ||
          settings.systemPrompt.includes('giáo trình') ||
          settings.systemPrompt.includes('Săn Deal AI'));
      const hasStaleWelcome =
        settings.welcomeMessage &&
        (settings.welcomeMessage.includes('UniPass') ||
          settings.welcomeMessage.includes('khóa học') ||
          settings.welcomeMessage.includes('tài liệu') ||
          settings.welcomeMessage.includes('học tập') ||
          settings.welcomeMessage.includes('săn deal') ||
          settings.welcomeMessage.includes('sách môn'));

      if (hasStalePrompt || hasStaleWelcome) {
        settings = await this.prisma.systemSettings.update({
          where: { id: 'default' },
          data: {
            ...(hasStalePrompt && { systemPrompt: DEFAULT_SYSTEM_PROMPT }),
            ...(hasStaleWelcome && { welcomeMessage: DEFAULT_WELCOME_MESSAGE }),
          },
        });
      }
    }

    return settings;
  }

  /**
   * Lấy API Key thô (đã giải mã) để gọi Gemini API:
   * Ưu tiên:
   * 1. Key trong Database (SystemSettings.geminiApiKey)
   * 2. Fallback về biến môi trường process.env.GEMINI_API_KEY
   */
  async getDecryptedApiKey(): Promise<string> {
    const settings = await this.getOrCreateSystemSettings();
    if (settings.geminiApiKey) {
      const decrypted = decryptApiKey(settings.geminiApiKey);
      if (decrypted && decrypted.trim().length > 0) {
        return decrypted.trim();
      }
    }

    // Fallback sang file .env
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }

    return '';
  }

  /**
   * Lấy thông tin cấu hình dành cho trang Admin (Tuyệt đối không trả nguyên văn key)
   */
  async getAdminSettings() {
    const settings = await this.getOrCreateSystemSettings();
    const rawKey = await this.getDecryptedApiKey();

    const isPromptStale =
      !settings.systemPrompt ||
      settings.systemPrompt.includes('UniPass') ||
      settings.systemPrompt.includes('sinh viên') ||
      settings.systemPrompt.includes('học tập') ||
      settings.systemPrompt.includes('giáo trình') ||
      settings.systemPrompt.includes('Săn Deal');

    const isWelcomeStale =
      !settings.welcomeMessage ||
      settings.welcomeMessage.includes('UniPass') ||
      settings.welcomeMessage.includes('khóa học') ||
      settings.welcomeMessage.includes('tài liệu') ||
      settings.welcomeMessage.includes('săn deal') ||
      settings.welcomeMessage.includes('sách môn');

    const cleanPrompt = isPromptStale ? DEFAULT_SYSTEM_PROMPT : settings.systemPrompt;
    const cleanWelcome = isWelcomeStale ? DEFAULT_WELCOME_MESSAGE : settings.welcomeMessage;

    const isConfigured = !!rawKey && rawKey.trim().length > 0;

    return {
      isConfigured,
      maskedKey: isConfigured ? maskApiKey(rawKey) : '',
      isAiEnabled: settings.isAiEnabled,
      aiModelName: settings.aiModelName || GEMINI_MODEL,
      systemPrompt: cleanPrompt,
      welcomeMessage: cleanWelcome,
      widgetRole: settings.widgetRole || DEFAULT_WIDGET_ROLE,
      isValidKey: settings.isValidKey,
      lastTestedAt: settings.lastTestedAt,
      hasEnvKeyFallback: !!process.env.GEMINI_API_KEY,
    };
  }

  /**
   * Cập nhật cấu hình Gemini API Key từ trang Admin
   */
  async updateAdminSettings(dto: UpdateGeminiSettingsDto) {
    console.log('Saving AI Config:', dto);
    let encryptedKey: string | undefined = undefined;

    // Hỗ trợ cả geminiApiKey hoặc apiKey alias
    const keyCandidate = dto.geminiApiKey !== undefined ? dto.geminiApiKey : dto.apiKey;
    if (keyCandidate !== undefined) {
      const trimmed = keyCandidate.trim();
      // Chỉ mã hóa lưu khi key mới không rỗng và không phải masked key
      if (
        trimmed.length > 0 &&
        !trimmed.includes('****') &&
        !trimmed.includes('••••')
      ) {
        encryptedKey = encryptApiKey(trimmed);
      }
    }

    const isAiEnabledVal = dto.isAiEnabled !== undefined ? dto.isAiEnabled : (dto as any).isEnabled;
    const modelCandidate = dto.aiModelName !== undefined ? dto.aiModelName : dto.model;
    const widgetRoleVal = dto.widgetRole !== undefined ? dto.widgetRole.trim() : undefined;

    const result = await this.prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(encryptedKey !== undefined && { geminiApiKey: encryptedKey }),
        ...(isAiEnabledVal !== undefined && { isAiEnabled: isAiEnabledVal }),
        ...(modelCandidate !== undefined && { aiModelName: modelCandidate.trim() }),
        ...(dto.systemPrompt !== undefined && { systemPrompt: dto.systemPrompt }),
        ...(dto.welcomeMessage !== undefined && { welcomeMessage: dto.welcomeMessage }),
        ...(widgetRoleVal !== undefined && { widgetRole: widgetRoleVal }),
      },
      create: {
        id: 'default',
        geminiApiKey: encryptedKey || null,
        isAiEnabled: isAiEnabledVal ?? true,
        aiModelName: (modelCandidate || GEMINI_MODEL).trim(),
        systemPrompt: dto.systemPrompt || DEFAULT_SYSTEM_PROMPT,
        welcomeMessage: dto.welcomeMessage || DEFAULT_WELCOME_MESSAGE,
        widgetRole: widgetRoleVal || DEFAULT_WIDGET_ROLE,
      },
    });

    console.log('Saved result:', result);
    return this.getAdminSettings();
  }

  /**
   * Lấy instance GoogleGenerativeAI client
   */
  async getAiClient(apiKeyOverride?: string): Promise<GoogleGenerativeAI> {
    let key = apiKeyOverride;
    if (!key || key.includes('****')) {
      key = await this.getDecryptedApiKey();
    }

    if (!key || key.trim().length === 0) {
      throw new BadRequestException('Hệ thống chưa được cấu hình Google Gemini API Key!');
    }

    return new GoogleGenerativeAI(key.trim());
  }

  /**
   * Lấy danh sách các mô hình Gemini được Google cấp phép cho API Key hiện tại
   */
  async listAvailableModels(apiKeyOverride?: string): Promise<string[]> {
    const fallbackModels = [
      'gemini-2.5-flash',
      'gemini-3.7-flash',
      'gemini-2.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ];

    let key = apiKeyOverride;
    if (!key || key.includes('****') || key.includes('••••')) {
      key = await this.getDecryptedApiKey();
    }

    if (!key) {
      return fallbackModels;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key.trim())}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        return fallbackModels;
      }

      const data = await res.json();
      if (Array.isArray(data.models)) {
        const models = data.models
          .filter((m: any) => {
            const methods: string[] = m.supportedGenerationMethods || [];
            return methods.includes('generateContent') && m.name.toLowerCase().includes('gemini');
          })
          .map((m: any) => m.name.replace(/^models\//, ''))
          .filter((name: string) => !name.includes('vision') && !name.includes('embedding'));

        if (models.length > 0) {
          // Đặt các model thông dụng lên đầu nếu có
          const priority = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-2.5-pro'];
          models.sort((a: string, b: string) => {
            const idxA = priority.indexOf(a);
            const idxB = priority.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });
          return Array.from(new Set([...models, ...fallbackModels]));
        }
      }
      return fallbackModels;
    } catch (err: any) {
      this.logger.warn(`Không thể lấy danh sách model trực tiếp từ Google API: ${err.message}`);
      return fallbackModels;
    }
  }

  /**
   * Kiểm tra kết nối (Test Key): gọi trực tiếp Google REST API để kiểm tra tính hợp lệ của Key
   * KHÔNG RÀNG BUỘC ĐỊNH DẠNG KEY, nhận nguyên văn chuỗi string người dùng nhập
   * Khắc phục dứt điểm lỗi Timeout 8001ms bằng REST API và timeout 25s
   */
  async testGeminiConnection(dto?: TestGeminiKeyDto) {
    let keyToTest = '';
    const keyCandidate = (dto?.geminiApiKey ?? dto?.apiKey ?? '').trim();

    // 1. Nếu client truyền key mới (không phải masked key), nhận nguyên văn
    if (
      keyCandidate.length > 0 &&
      !keyCandidate.includes('••••') &&
      !keyCandidate.includes('****')
    ) {
      keyToTest = keyCandidate;
    } else {
      // 2. Tự động lấy key lưu trong Database và GIẢI MÃ (Decrypt AES-256) ra chuỗi gốc
      keyToTest = await this.getDecryptedApiKey();
    }

    if (!keyToTest || keyToTest.trim().length === 0) {
      throw new BadRequestException(
        'Chưa có Google Gemini API Key để kiểm tra! Vui lòng nhập API Key.',
      );
    }

    const startTime = Date.now();
    try {
      // Gọi endpoint lấy danh sách models nhẹ nhất của Google để kiểm tra tính hợp lệ của Key
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest.trim())}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000), // Nâng timeout lên 25 giây
      });

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        await this.prisma.systemSettings.update({
          where: { id: 'default' },
          data: {
            isValidKey: false,
            lastTestedAt: new Date(),
          },
        });
        const errorMsg = data?.error?.message || `Google API báo lỗi (${response.status})`;
        throw new BadRequestException(errorMsg);
      }

      // Cập nhật trạng thái hợp lệ vào DB
      await this.prisma.systemSettings.update({
        where: { id: 'default' },
        data: {
          isValidKey: true,
          lastTestedAt: new Date(),
        },
      });

      const models = data.models?.map((m: any) => m.name.replace('models/', '')) || [];

      return {
        success: true,
        isValid: true,
        message: 'Kết nối Google Gemini thành công!',
        latencyMs,
        models,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      await this.prisma.systemSettings.update({
        where: { id: 'default' },
        data: {
          isValidKey: false,
          lastTestedAt: new Date(),
        },
      });

      if (
        err?.name === 'TimeoutError' ||
        String(err).includes('timeout') ||
        String(err).includes('aborted')
      ) {
        throw new BadRequestException(
          'Đường truyền kết nối tới máy chủ Google bị gián đoạn hoặc quá thời gian chờ (Timeout sau 25s). Vui lòng thử lại sau!',
        );
      }

      throw new BadRequestException(
        `Lỗi kết nối tới máy chủ Google: ${err?.message || String(err)}`,
      );
    }
  }

  /**
   * Lõi sinh văn bản tổng quát (Reusable Core AI Text Generation)
   */
  async generateText(prompt: string, systemInstruction?: string, modelOverride?: string): Promise<string> {
    const settings = await this.getOrCreateSystemSettings();
    if (!settings.isAiEnabled) {
      throw new BadRequestException('Hệ thống AI đang tạm tắt.');
    }

    const genAI = await this.getAiClient();
    const modelName = (modelOverride || settings.aiModelName || GEMINI_MODEL).trim();

    const model = genAI.getGenerativeModel(
      {
        model: modelName,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      },
      { timeout: 15000 },
    );

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Tự động sinh mô tả sản phẩm máy bánh công nghiệp chuẩn kỹ thuật & SEO
   */
  async generateProductDescription(productName: string, specs?: Record<string, any>): Promise<string> {
    const specsText = specs ? JSON.stringify(specs, null, 2) : 'Chưa có thông số chi tiết';
    const prompt = `Viết mô tả kỹ thuật và bài giới thiệu bán lẻ hấp dẫn, chuẩn kỹ thuật cho sản phẩm thiết bị bánh sau đây:
Tên máy: ${productName}
Thông số kỹ thuật:
${specsText}

Yêu cầu:
1. Nêu bật ưu điểm cấu tạo, công suất, chất liệu inox và độ bền bỉ.
2. Ứng dụng thực tế cho tiệm bánh, xưởng bánh công nghiệp.
3. Chính sách cam kết test máy tại xưởng, bảo hành kỹ thuật tận nơi và giao hàng toàn quốc của Công Nguyên.
4. Trình bày định dạng markdown mạch lạc, có bullet points.`;

    const systemInstruction = 'Bạn là Kỹ sư trưởng chuyên ngành cơ điện lạnh và chế tạo máy làm bánh của Công Nguyên.';
    return this.generateText(prompt, systemInstruction);
  }

  /**
   * Tạo System Prompt tự động bằng AI dựa trên toàn bộ dữ liệu thực tế của website:
   * 1. Thông tin thương hiệu, liên hệ, hotline, địa chỉ xưởng (GeneralSettings, ContactSettings, HomepageConfig)
   * 2. Danh mục thiết bị làm bánh thực tế (Categories)
   * 3. Danh sách máy tồn kho thực tế (Products)
   * 4. Các chính sách cam kết, bảo hành, kiểm định xưởng
   */
  async generateAutoSystemPrompt(): Promise<string> {
    // 1. Thu thập dữ liệu thực tế từ Database
    const [contact, general, homepage, categories, products] = await Promise.all([
      this.prisma.contactSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      this.prisma.generalSettings.findUnique({ where: { id: 'default' } }).catch(() => null),
      this.prisma.homepageConfig.findUnique({ where: { id: 'default' } }).catch(() => null),
      this.prisma.category.findMany({
        where: { isActive: true },
        select: { name: true, slug: true, description: true },
        orderBy: { sortOrder: 'asc' },
      }).catch(() => []),
      this.prisma.product.findMany({
        where: { stock: { gt: 0 } },
        take: 12,
        select: {
          name: true,
          modelCode: true,
          basePrice: true,
          originalPrice: true,
          condition: true,
          stock: true,
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
        },
      }).catch(() => []),
    ]);

    const brandName = general?.brandName || 'CÔNG NGUYÊN';
    const hotline = contact?.hotline || '0976 619 044';
    const zaloPhone = contact?.zaloPhone || '0976619044';
    const workshopAddress = contact?.showroomAddress || '6/3 DN4, Đông Hưng Thuận, Quận 12, TP.HCM';
    const founderLine = homepage?.founderLine || 'Lê Nguyễn Minh Trung – Trực tiếp kiểm định kỹ thuật & bàn giao máy';

    const categoriesList = categories.length > 0
      ? categories.map((c, i) => `${i + 1}. ${c.name} (slug: ${c.slug})${c.description ? ` - ${c.description}` : ''}`).join('\n')
      : '- Tủ trưng bày bánh kem & Bảo quản (slug: tu-trung-bay-banh)\n- Lò nướng bánh công nghiệp (slug: lo-nuong-cong-nghiep)\n- Máy trộn bột & Đánh trứng (slug: may-tron-bot-danh-trung)';

    const productsList = products.length > 0
      ? products.map((p, i) => {
          const bPrice = p.basePrice ? Number(p.basePrice).toLocaleString('vi-VN') + ' đ' : 'Liên hệ';
          const oPrice = p.originalPrice ? Number(p.originalPrice).toLocaleString('vi-VN') + ' đ' : '';
          const brand = p.brand?.name ? ` | Thương hiệu: ${p.brand.name}` : '';
          const cat = p.category?.name ? ` | Danh mục: ${p.category.name} (${p.category?.slug})` : '';
          const priceInfo = oPrice ? ` | Giá thanh lý: ${bPrice} (Giá máy mới tham khảo: ${oPrice})` : ` | Giá bán: ${bPrice}`;
          return `  ${i + 1}. "${p.name}"${cat}${brand}${priceInfo} | Tồn kho: ${p.stock}`;
        }).join('\n')
      : '  1. "Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan" | Giá ưu đãi: 45.000.000 đ | Tồn kho: 1\n  2. "Lò nướng đối lưu Southstar 4 mâm" | Giá ưu đãi: 25.000.000 đ | Tồn kho: 1\n  3. "Cối đánh trứng / Trộn bột Đài Loan Hobat" | Giá ưu đãi: 16.000.000 đ | Tồn kho: 1';

    const metaPrompt = `Bạn là Kỹ sư Trưởng kiêm Chuyên gia Prompt Engineering (AI Prompt Engineer) hàng đầu thế giới.
Nhiệm vụ của bạn: Hãy viết ra một SYSTEM PROMPT hoàn chỉnh, chi tiết, chặt chẽ và chuyên nghiệp nhất cho AI Chat Widget tư vấn khách hàng trên website ${brandName} (congnguyen.com.vn).

THÔNG TIN THỰC TẾ DOANH NGHIỆP TỪ DATABASE:
- Tên đơn vị: ${brandName} (Website: congnguyen.com.vn)
- Lĩnh vực kinh doanh: Mua bán, tân trang, thanh lý máy móc và dây chuyền làm bánh công nghiệp giá tốt tại TP.HCM.
- Hotline & Zalo kỹ thuật: ${hotline} (Link Zalo: https://zalo.me/${zaloPhone})
- Địa chỉ xưởng thực tế: ${workshopAddress} (Hỗ trợ khách cắm điện 1 pha hoặc 3 pha chạy thử máy, nướng bánh mẫu hoặc nhào bột trực tiếp tại xưởng).
- Đại diện kỹ thuật: ${founderLine}
- Cam kết kỹ thuật: Bảo hành tận nơi 06 - 12 tháng, đổi trả 7 ngày nếu lỗi kỹ thuật, hỗ trợ thu mua thanh lý máy cũ.

DANH MỤC THIẾT BỊ LÀM BÁNH TRỌNG TÂM:
${categoriesList}

DANH SÁCH MÁY THỰC TẾ TRONG KHO (STOCK > 0):
${productsList}

CÁC NGUYÊN TẮC BẮT BUỘC TRONG SYSTEM PROMPT CẦN TẠO:
1. ĐỊNH DANH VAI TRÒ: AI đóng vai trò là "Chuyên viên Kỹ thuật & Báo Giá Thiết Bị Bánh Công Nguyên".
2. KHÓA CHẶT DỮ LIỆU (Strict Product Grounding): CHỈ tư vấn và báo giá thiết bị làm bánh của Công Nguyên. Tuyệt đối KHÔNG trả lời về sách vở, tài liệu học tập, giáo trình, hàng quán ăn uống hay đồ công nghệ không liên quan.
3. QUY TẮC SO SÁNH GIÁ TIẾT KIỆM: Khi khách hỏi giá bất kỳ máy nào, luôn hướng dẫn khách hàng so sánh số tiền tiết kiệm được so với máy mới 100% ngoài thị trường (tiết kiệm 40% - 60%).
4. QUY TẮC TỒN KHO & MÁY HẾT HÀNG: Chỉ gợi ý máy còn hàng (stock > 0). Nếu khách hỏi máy đã hết, lịch sự thông báo máy vừa chốt cọc và mời khách để lại Zalo để kỹ thuật viên báo ngay khi đợt máy tân trang tiếp theo hoàn thiện.
5. THÔNG TIN LIÊN HỆ & CTA: Luôn kích thích khách bấm nút "Báo giá (RFQ)" để nhận khảo sát công suất/điện 3 pha, hoặc kết bạn Zalo ${hotline} để nhận video quay test máy thực tế tại xưởng.
6. PHONG CÁCH: Kỹ thuật am hiểu, lịch sự, trung thực, tạo niềm tin cho chủ tiệm bánh.

YÊU CẦU ĐẦU RA:
Viết TRỰC TIẾP toàn bộ nội dung System Prompt hoàn chỉnh bằng tiếng Việt, mạch lạc, có phân mục rõ ràng. KHÔNG đưa thêm bất kỳ lời dẫn nhập hay lời kết nào ngoài nội dung System Prompt.`;

    try {
      const generated = await Promise.race([
        this.generateText(metaPrompt),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out after 15s')), 15000)
        ),
      ]);
      if (generated && generated.trim().length > 100) {
        return generated.trim();
      }
    } catch (err: any) {
      this.logger.warn(`Không thể gọi Gemini sinh prompt: ${err?.message || err}. Dùng fallback chuẩn xưởng.`);
    }

    // Fallback nếu chưa cấu hình key hoặc Gemini gặp sự cố mạng
    return `Bạn là Chuyên viên Kỹ thuật & Báo Giá Thiết Bị Bánh của ${brandName} (Website: congnguyen.com.vn) - đơn vị chuyên mua bán, tân trang, thanh lý máy móc và dây chuyền làm bánh công nghiệp thực tế tại TP.HCM. Nhiệm vụ của bạn là:
- Tư vấn thông số kỹ thuật, công suất và ứng dụng thực tế của các nhóm thiết bị làm bánh chuẩn của Công Nguyên:
${categoriesList}
- KHO HÀNG THỰC TẾ & KHÓA CHẶT DỮ LIỆU (STRICT PRODUCT GROUNDING): Bạn ghi nhớ chính xác và CHỈ gợi ý trong danh sách các dòng máy đang có sẵn tại kho Công Nguyên:
${productsList}
- QUY TẮC ĐỒNG BỘ TỒN KHO: Chỉ gợi ý các dòng máy còn hàng trong kho. Nếu khách hỏi máy đã hết, thông báo lịch sự máy vừa chốt cọc và mời khách kết bạn Zalo ${hotline} để nhận thông báo đợt máy tân trang tiếp theo.
- QUY TẮC SO SÁNH GIÁ TIẾT KIỆM: Khi khách hỏi giá bất kỳ máy nào, bắt buộc nhấn mạnh số tiền tiết kiệm so với mua mới trên thị trường (tiết kiệm từ 40% - 60%). Nêu 3 cam kết an tâm: Bảo hành kỹ thuật tận nơi 06 - 12 tháng, đổi trả 7 ngày nếu lỗi kỹ thuật, và hỗ trợ test máy trực tiếp tại xưởng ${workshopAddress}.
- THÔNG TIN LIÊN HỆ KỸ THUẬT & ZALO: Hotline & Zalo chính thức duy nhất là ${hotline} (link chat Zalo: https://zalo.me/${zaloPhone}) để được kỹ sư trưởng thẩm định và hỗ trợ ngay.
- Kích thích khách hàng bấm nút "Báo giá (RFQ)" để nhận khảo sát điện 1 pha/3 pha hoặc hỗ trợ vận chuyển lắp đặt tận nơi.
- Tuyệt đối KHÔNG trả lời về sách, tài liệu học tập, giáo trình sinh viên, máy tính cũ. Luôn giữ văn phong kỹ thuật, am hiểu ngành bánh và tôn trọng khách hàng.`;
  }

  /**
   * Khung Chat Tư Vấn Khách Hàng (Public Chatbot)
   * Khóa chặt phạm vi dữ liệu (Grounding strictly to Website Products):
   * Chỉ tư vấn sản phẩm đang có trong kho (status: available), không tư vấn hướng nghiệp.
   */
  async chatWithCustomer(dto: AiChatDto) {
    const fallbackMessage =
      'Hệ thống tư vấn AI hiện đang bảo trì, vui lòng quay lại sau hoặc liên hệ hỗ trợ trực tiếp!';

    const settings = await this.getOrCreateSystemSettings();
    if (!settings.isAiEnabled) {
      return {
        success: false,
        reply: fallbackMessage,
        isFallback: true,
      };
    }

    const apiKey = await this.getDecryptedApiKey();
    if (!apiKey) {
      this.logger.warn('Chưa cấu hình Gemini API Key. Trả về thông báo lịch sự.');
      return {
        success: false,
        reply: fallbackMessage,
        isFallback: true,
      };
    }

    try {
      // 1. Backend Chat Context Injection: Truy vấn danh mục sản phẩm thanh lý có trạng thái AVAILABLE & stock > 0
      let availableProducts: any[] = [];
      let outOfStockProducts: any[] = [];

      try {
        availableProducts = await this.prisma.product.findMany({
          where: {
            availability: 'AVAILABLE',
            status: { not: 'out_of_stock' },
            stock: { gt: 0 },
            isActive: true,
          },
          take: 25,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            condition: true,
            refurbishDetails: true,
            availability: true,
            status: true,
            stock: true,
            soldCount: true,
            basePrice: true,
            originalPrice: true,
            thumbnail: true,
            description: true,
            summary: true,
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            variants: { select: { stockQuantity: true } },
          },
        });

        outOfStockProducts = await this.prisma.product.findMany({
          where: {
            OR: [
              { stock: { lte: 0 } },
              { status: 'out_of_stock' },
              { availability: 'SOLD' },
            ],
            isActive: true,
          },
          take: 25,
          select: {
            id: true,
            name: true,
            slug: true,
            stock: true,
            status: true,
            availability: true,
          },
        });
      } catch (dbErr: any) {
        this.logger.warn(`Truy vấn sản phẩm DB gặp lỗi: ${dbErr.message}`);
      }

      if (!availableProducts || availableProducts.length === 0) {
        availableProducts = FALLBACK_IN_STOCK_PRODUCTS.filter(
          (p) => (p.stock || 0) > 0 && p.status !== 'out_of_stock' && p.availability !== 'SOLD',
        );
      }

      const catalogSummary = availableProducts
        .map((p, idx) => {
          const condText =
            p.refurbishDetails ||
            (p.condition === 'LIKE_NEW_99'
              ? 'Hàng mới 100% xả thanh lý kho'
              : p.condition === 'EXCELLENT_90_95'
              ? 'Độ mới 90%'
              : p.condition === 'FAIR_80'
              ? 'Thanh lý tiệm bánh, nhiệt lên đều'
              : 'Tân trang đạt chuẩn kỹ thuật');
          const basePriceNum = p.basePrice ? Number(p.basePrice) : 0;
          const origPriceNum = p.originalPrice ? Number(p.originalPrice) : 0;
          const priceStr = basePriceNum > 0
            ? `${basePriceNum.toLocaleString('vi-VN')} đ`
            : 'Thương lượng';
          const origStr = origPriceNum > 0
            ? ` [Giá máy mới thị trường: ~${origPriceNum.toLocaleString('vi-VN')} đ]`
            : '';
          const savingsNum = origPriceNum > basePriceNum && basePriceNum > 0 ? origPriceNum - basePriceNum : 0;
          const savingsPercent = origPriceNum > 0 && savingsNum > 0 ? Math.round((savingsNum / origPriceNum) * 100) : 0;
          const savingsStr = savingsNum > 0
            ? ` | TIẾT KIỆM SO VỚI MUA MỚI: ${savingsNum.toLocaleString('vi-VN')} đ (-${savingsPercent}%)`
            : '';
          const brandName = typeof p.brand === 'object' && p.brand !== null ? p.brand.name : p.brand;
          const brandStr = brandName ? ` | Thương hiệu: "${brandName}"` : '';
          const totalStock = Array.isArray(p.variants) && p.variants.length > 0
            ? p.variants.reduce((acc: number, v: any) => acc + (v.stockQuantity || 0), 0)
            : p.stock;
          const stockStr = totalStock ? ` | Tồn kho: ${totalStock} máy` : ' | Tồn kho: 1 máy';
          const catStr = p.category?.name ? ` | Danh mục: "${p.category.name}"` : '';
          const descStr = p.description || p.summary ? ` | Mô tả: ${p.description || p.summary}` : '';
          return `- Thiết bị #${idx + 1}: "${p.name}" (Slug: "${p.slug}")${catStr}${brandStr} | Giá bán thanh lý: ${priceStr}${origStr}${savingsStr} | Tình trạng: ${condText}${stockStr} | Trạng thái: AVAILABLE${descStr}`;
        })
        .join('\n');

      const isPromptStale =
        !settings.systemPrompt ||
        settings.systemPrompt.includes('UniPass') ||
        settings.systemPrompt.includes('sinh viên') ||
        settings.systemPrompt.includes('học tập') ||
        settings.systemPrompt.includes('giáo trình') ||
        settings.systemPrompt.includes('Săn Deal');

      const baseInstruction = isPromptStale ? DEFAULT_SYSTEM_PROMPT : settings.systemPrompt;

      const outOfStockSection = outOfStockProducts.length > 0
        ? `\n=== DANH SÁCH SẢN PHẨM HIỆN ĐÃ HẾT HÀNG (STOCK = 0 / OUT_OF_STOCK / ĐÃ BÁN) ===\n` +
          outOfStockProducts.map(p => `- "${p.name}" (Slug: "${p.slug}") [HẾT HÀNG - STOCK: ${p.stock ?? 0}]`).join('\n') +
          `\n=== HẾT DANH SÁCH HẾT HÀNG ===\n`
        : '';

      const systemInstruction = `${baseInstruction}

=== DANH SÁCH THIẾT BỊ BÁNH THANH LÝ & TÂN TRANG ĐANG CÓ SẴN (STATUS: AVAILABLE, STOCK > 0) TRONG KHO CÔNG NGUYÊN ===
${catalogSummary}
=== HẾT DANH SÁCH THIẾT BỊ CÒN HÀNG ===
${outOfStockSection}

QUY TẮC BẮT BUỘC KHÓA CHẶT DỮ LIỆU & QUẢN LÝ TỒN KHO THỜI GIAN THỰC (REAL-TIME STOCK & OUT-OF-STOCK RULES):
1. Bạn CHỈ ĐƯỢC PHÉP gợi ý và báo giá các dòng máy CÒN HÀNG TRONG KHO (stock > 0) có trong danh sách trên. Tuyệt đối KHÔNG gợi ý máy đã hết hàng hoặc tự bịa ra model không tồn tại.
2. NẾU KHÁCH HÀNG HỎI VỀ MÁY ĐÃ HẾT HÀNG (stock === 0 hoặc out_of_stock hoặc nằm trong danh sách HẾT HÀNG):
   BẮT BUỘC THÔNG BÁO LỊCH SỰ ĐÚNG NGUYÊN VĂN:
   "Dòng máy này hiện kho vừa chốt cọc cho khách, bạn có thể để lại số Zalo để kỹ thuật viên báo ngay khi đợt máy tân trang tiếp theo hoàn thiện nhé!"
   (Sau đó cung cấp số Hotline & Zalo kỹ thuật 0976 619 044 - link chat: https://zalo.me/0976619044 để hỗ trợ thêm).
3. NẾU khách hàng hỏi tìm dòng máy mà trong kho hoàn toàn không có:
   BẮT BUỘC PHẢI TRẢ LỜI ĐÚNG:
   "Hiện tại kho máy tân trang của Công Nguyên chưa có sẵn model chính xác này. Quý khách có thể gửi yêu cầu báo giá đặt hàng (RFQ) hoặc liên hệ hotline & Zalo kỹ thuật 0976 619 044 (https://zalo.me/0976619044) để đội ngũ kỹ thuật Công Nguyên hỗ trợ tìm máy và thẩm định nhé!"
   Tuyệt đối KHÔNG tự sáng tạo sản phẩm, KHÔNG nói chuyện về giáo trình, tài liệu sinh viên.
4. QUY TẮC SO SÁNH GIÁ & NHẤN MẠNH TIẾT KIỆM (BẮT BUỘC KHI KHÁCH HỎI GIÁ):
   - Khi khách hàng hỏi giá bất kỳ máy nào, BẮT BUỘC PHẢI TRẢ LỜI CẢ 2 THÔNG SỐ: Giá máy mới ngoài thị trường và Giá thanh lý Công Nguyên, sau đó TÍNH RÕ VÀ NHẤN MẠNH SỐ TIỀN TIẾT KIỆM ĐƯỢC.
   - Ví dụ chuẩn mực:
     "Tủ bánh kem 1m5 5 tầng Ruyshing giá mới trên thị trường khoảng 97 triệu, bên mình thanh lý máy tân trang chỉ 45 triệu, bạn tiết kiệm được tận 52 triệu cho tiệm của mình. Bạn có muốn kỹ thuật viên gửi video quay test máy qua Zalo 0976 619 044 không ạ?"
   - Luôn nhấn mạnh 3 chính sách cam kết kỹ thuật an tâm đi kèm:
     ✓ Bảo hành kỹ thuật tận nơi
     ✓ Đổi trả nếu lỗi kỹ thuật trong 7 ngày
     ✓ Hỗ trợ test máy trực tiếp tại xưởng 6/3 DN4, Đông Hưng Thuận
5. Khi khách hỏi dòng máy có trong danh sách còn hàng:
   - Chọn ra 1–3 thiết bị phù hợp nhất đang còn hàng (stock > 0).
   - Nêu rõ: Tên thiết bị, Giá thanh lý kèm số tiền tiết kiệm, Tình trạng kiểm định kỹ thuật (ví dụ: Độ mới 90%, Tân trang chuẩn xưởng), công suất.
   - Bắt buộc chèn thẻ định dạng: :::product_card{"slug":"<slug_chính_xác_từ_danh_sách>"}::: ngay trong câu trả lời để hệ thống tự động hiển thị thẻ máy tương tác.
   - Khi đính kèm link sản phẩm hoặc điều hướng web, luôn sử dụng tên miền chính thức https://congnguyen.com.vn (ví dụ: https://congnguyen.com.vn/products/<slug> hoặc https://congnguyen.com.vn/rfq), tuyệt đối không dùng congnguyen.vn hoặc tên miền khác.
6. KHI KHÁCH HÀNG YÊU CẦU GẶP TƯ VẤN VIÊN, LIÊN HỆ KỸ THUẬT HOẶC XIN SỐ ZALO:
   - Cung cấp số Hotline & Zalo chính thức duy nhất của Công Nguyên: 0976 619 044
   - Cung cấp link Zalo trực tiếp: https://zalo.me/0976619044
   - Hướng dẫn khách hàng có thể gọi điện trực tiếp hoặc gửi hình ảnh, video máy cũ qua Zalo 0976 619 044 để kỹ sư trưởng hỗ trợ định giá và thẩm định kỹ thuật nhanh nhất.`;

      const activeModel = settings.aiModelName || GEMINI_MODEL;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

      // Xây dựng contents từ lịch sử chat + câu hỏi hiện tại
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(dto.history)) {
        for (const item of dto.history.slice(-8)) {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: [{ text: item.text }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: dto.message }],
      });

      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.candidates && data.candidates.length > 0) {
        const rawReply =
          data.candidates[0].content?.parts?.[0]?.text ||
          'Hiện tại kho máy tân trang của Công Nguyên chưa có sẵn model chính xác này. Quý khách có thể gửi yêu cầu báo giá đặt hàng (RFQ) hoặc liên hệ hotline & Zalo kỹ thuật 0976 619 044 nhé!';

        // Đảm bảo triệt để mọi link điều hướng hoặc email trả về luôn dùng tên miền chính thức congnguyen.com.vn
        const replyText = rawReply
          .replace(/https?:\/\/(www\.)?congnguyen\.vn/gi, 'https://congnguyen.com.vn')
          .replace(/@congnguyen\.vn/gi, '@congnguyen.com.vn')
          .replace(/\bcongnguyen\.vn\b/gi, 'congnguyen.com.vn');

        // Trích xuất các slug sản phẩm được gợi ý để kiểm tra tồn kho thực tế
        const cardRegex = /:::product_card\{"slug":"([^"]+)"\}:::/g;
        const slugs: string[] = [];
        let match;
        while ((match = cardRegex.exec(replyText)) !== null) {
          if (!slugs.includes(match[1])) {
            slugs.push(match[1]);
          }
        }

        // Cũng quét thêm trường hợp link markdown /products/:slug
        const linkRegex = /\/products\/([a-zA-Z0-9_-]+)/g;
        while ((match = linkRegex.exec(replyText)) !== null) {
          if (!slugs.includes(match[1])) {
            slugs.push(match[1]);
          }
        }

        let recommendedProducts: any[] = [];
        if (slugs.length > 0) {
          try {
            const found = await this.prisma.product.findMany({
              where: {
                slug: { in: slugs },
                stock: { gt: 0 },
                status: { not: 'out_of_stock' },
                availability: 'AVAILABLE',
              },
              select: {
                id: true,
                name: true,
                slug: true,
                condition: true,
                availability: true,
                status: true,
                stock: true,
                basePrice: true,
                originalPrice: true,
                thumbnail: true,
                category: { select: { id: true, name: true, slug: true } },
              },
            });
            recommendedProducts = found;
          } catch {
            // Match with fallback list if DB offline
            recommendedProducts = FALLBACK_IN_STOCK_PRODUCTS.filter((p) =>
              slugs.includes(p.slug) && (p.stock || 0) > 0 && p.status !== 'out_of_stock',
            );
          }
        }

        return {
          success: true,
          reply: replyText,
          isFallback: false,
          recommendedProducts,
        };
      } else {
        const errorMsg = data.error?.message || '';
        this.logger.error(`Gemini API error (${res.status}): ${errorMsg}`);
        return {
          success: false,
          reply: fallbackMessage,
          isFallback: true,
          recommendedProducts: [],
        };
      }
    } catch (err: any) {
      this.logger.error(`Lỗi ngoại lệ khi gọi Gemini API: ${err.message}`);
      return {
        success: false,
        reply: fallbackMessage,
        isFallback: true,
        recommendedProducts: [],
      };
    }
  }

  /**
   * Lấy câu chào mở đầu và vai trò hiển thị phục vụ Storefront Widget
   */
  async getPublicWelcomeInfo() {
    const settings = await this.getOrCreateSystemSettings();
    const isWelcomeStale =
      !settings.welcomeMessage ||
      settings.welcomeMessage.includes('UniPass') ||
      settings.welcomeMessage.includes('khóa học') ||
      settings.welcomeMessage.includes('tài liệu') ||
      settings.welcomeMessage.includes('học tập') ||
      settings.welcomeMessage.includes('săn deal') ||
      settings.welcomeMessage.includes('sách môn');

    const cleanWelcome = isWelcomeStale ? DEFAULT_WELCOME_MESSAGE : settings.welcomeMessage;

    return {
      isAiEnabled: settings.isAiEnabled,
      welcomeMessage: cleanWelcome,
      advisorName: settings.widgetRole || DEFAULT_WIDGET_ROLE,
      widgetRole: settings.widgetRole || DEFAULT_WIDGET_ROLE,
    };
  }
}

