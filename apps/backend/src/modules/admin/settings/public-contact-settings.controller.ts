import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ContactSettingsService } from './contact-settings.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UpdateContactSettingsDto } from './dto/contact-settings.dto';

@Controller('settings/contact')
export class PublicContactSettingsController {
  constructor(private readonly service: ContactSettingsService) {}

  /**
   * GET /api/v1/settings/contact
   * API công khai cho Storefront lấy thông tin liên hệ (hotline, zalo, facebook, email, showroom)
   */
  @Get()
  async getContactSettings() {
    return this.service.getContactSettings();
  }

  /**
   * PUT /api/v1/settings/contact
   * Cho phép cập nhật nếu có Admin Token
   */
  @Put()
  @UseGuards(AdminAuthGuard)
  async updateContactSettings(@Body() dto: UpdateContactSettingsDto) {
    return this.service.updateContactSettings(dto);
  }
}
