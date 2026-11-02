import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { GeneralSettingsService } from './general-settings.service';
import { UpdateBrandSettingsDto } from './dto/brand-settings.dto';

@Controller('admin/settings')
@UseGuards(AdminAuthGuard)
export class AdminBrandSettingsController {
  constructor(private readonly service: GeneralSettingsService) {}

  /**
   * GET /api/v1/admin/settings/brand
   */
  @Get('brand')
  async getBrandSettings() {
    return this.service.getGeneralSettings();
  }

  /**
   * GET /api/v1/admin/settings/general
   */
  @Get('general')
  async getGeneralSettings() {
    return this.service.getGeneralSettings();
  }

  /**
   * PUT /api/v1/admin/settings/brand
   */
  @Put('brand')
  async updateBrandSettings(@Body() dto: UpdateBrandSettingsDto) {
    return this.service.updateBrandSettings(dto);
  }

  /**
   * PUT /api/v1/admin/settings/general
   */
  @Put('general')
  async updateGeneralSettings(@Body() dto: UpdateBrandSettingsDto) {
    return this.service.updateBrandSettings(dto);
  }

  /**
   * POST /api/v1/admin/settings/brand/reset
   */
  @Post('brand/reset')
  async resetBrandSettings() {
    return this.service.resetBrandSettings();
  }
}

