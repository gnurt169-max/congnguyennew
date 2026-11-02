import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { GeneralSettingsService } from './general-settings.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UpdateBrandSettingsDto } from './dto/brand-settings.dto';

@Controller('settings')
export class PublicBrandSettingsController {
  constructor(private readonly service: GeneralSettingsService) {}

  /**
   * GET /api/v1/settings/general
   * API công khai cho Storefront, Navbar, Header, Footer lấy thông tin thương hiệu
   */
  @Get('general')
  async getGeneralSettings() {
    return this.service.getGeneralSettings();
  }

  /**
   * GET /api/v1/settings/brand
   * Hỗ trợ alias /settings/brand
   */
  @Get('brand')
  async getBrandSettings() {
    return this.service.getGeneralSettings();
  }

  /**
   * PUT /api/v1/settings/brand
   * Cập nhật thông tin nhận diện thương hiệu (Bảo vệ bằng AdminAuthGuard)
   */
  @Put('brand')
  @UseGuards(AdminAuthGuard)
  async updateBrandSettings(@Body() dto: UpdateBrandSettingsDto) {
    return this.service.updateBrandSettings(dto);
  }

  /**
   * PUT /api/v1/settings/general
   * Cập nhật thông tin cài đặt chung (Bảo vệ bằng AdminAuthGuard)
   */
  @Put('general')
  @UseGuards(AdminAuthGuard)
  async updateGeneralSettings(@Body() dto: UpdateBrandSettingsDto) {
    return this.service.updateBrandSettings(dto);
  }
}

