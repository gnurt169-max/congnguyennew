import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminAuthGuard } from '../admin/auth/admin-auth.guard';
import { AiService } from './ai.service';
import {
  UpdateGeminiSettingsDto,
  TestGeminiKeyDto,
  GenerateTextDto,
  GenerateProductDescriptionDto,
} from './dto/gemini-settings.dto';

@Controller([
  'admin/settings/gemini',
  'settings/gemini',
  'api/v1/admin/settings/gemini',
  'settings/ai',
  'admin/settings/ai',
])
@UseGuards(AdminAuthGuard)
export class AiAdminController {
  constructor(private readonly aiService: AiService) {}

  /**
   * GET /api/v1/admin/settings/gemini (hoặc /settings/ai)
   * Lấy cấu hình trạng thái Google Gemini Key (đã được mask bảo mật)
   */
  @Get()
  async getSettings() {
    return this.aiService.getAdminSettings();
  }

  /**
   * PUT /api/v1/admin/settings/gemini (hoặc /settings/ai)
   * Lưu cấu hình Google Gemini Key mới (được mã hóa vào Database)
   */
  @Put()
  async updateSettings(@Body() dto: UpdateGeminiSettingsDto) {
    return this.aiService.updateAdminSettings(dto);
  }

  /**
   * POST /api/v1/admin/settings/gemini/test (hoặc /settings/ai/test)
   * Kiểm tra kết nối trực tiếp đến máy chủ Google Gemini API
   */
  @Post('test')
  async testConnection(@Body() dto: TestGeminiKeyDto) {
    return this.aiService.testGeminiConnection(dto);
  }

  /**
   * GET /api/v1/admin/settings/gemini/models (hoặc /settings/ai/models)
   * Lấy danh sách mô hình Gemini khả dụng từ Google
   */
  @Get('models')
  async getAvailableModels(@Query('apiKey') apiKey?: string) {
    const models = await this.aiService.listAvailableModels(apiKey);
    return {
      success: true,
      models,
    };
  }

  /**
   * POST /api/v1/admin/settings/gemini/generate-text
   * Điểm kết nối sinh văn bản dùng chung cho các module nội bộ
   */
  @Post('generate-text')
  async generateText(@Body() dto: GenerateTextDto) {
    const text = await this.aiService.generateText(dto.prompt, dto.systemInstruction);
    return {
      success: true,
      text,
    };
  }

  /**
   * POST /api/v1/admin/settings/gemini/generate-product-description
   * Tự động sinh mô tả thiết bị bánh công nghiệp
   */
  @Post('generate-product-description')
  async generateProductDescription(@Body() dto: GenerateProductDescriptionDto) {
    const description = await this.aiService.generateProductDescription(dto.productName, dto.specs);
    return {
      success: true,
      description,
    };
  }

  /**
   * POST /api/v1/admin/settings/gemini/generate-system-prompt
   * hoặc /api/v1/settings/ai/generate-system-prompt
   * Tự động sinh System Prompt chuẩn bằng AI từ dữ liệu thực tế của website
   */
  @Post('generate-system-prompt')
  async generateSystemPrompt() {
    const prompt = await this.aiService.generateAutoSystemPrompt();
    return {
      success: true,
      systemPrompt: prompt,
    };
  }
}
