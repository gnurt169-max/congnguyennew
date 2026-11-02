import { Controller, Post, Get, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/gemini-settings.dto';

@Controller('ai')
export class AiPublicController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /api/v1/ai/chat
   * Nhận câu hỏi từ khách hàng/học viên và trả lời tư vấn qua Google Gemini API
   */
  @Post('chat')
  async chat(@Body() dto: AiChatDto) {
    return this.aiService.chatWithCustomer(dto);
  }

  /**
   * GET /api/v1/ai/welcome
   * Lấy câu chào mở đầu và trạng thái kích hoạt chatbot
   */
  @Get('welcome')
  async getWelcome() {
    return this.aiService.getPublicWelcomeInfo();
  }
}
