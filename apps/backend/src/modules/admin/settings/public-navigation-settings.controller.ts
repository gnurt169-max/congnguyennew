import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { NavigationSettingService } from './navigation-setting.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UpdateNavigationSettingsDto } from './dto/navigation-setting.dto';

@Controller(['settings/navigation', 'settings/menu'])
export class PublicNavigationSettingsController {
  constructor(private readonly service: NavigationSettingService) {}

  /**
   * GET /api/v1/settings/navigation hoặc /api/v1/settings/menu
   * API công khai cho Client Frontend lấy danh sách menu điều hướng Header
   */
  @Get()
  async getNavigationSettings() {
    return this.service.getNavigationSettings();
  }

  /**
   * PUT /api/v1/settings/navigation hoặc /api/v1/settings/menu
   * Cập nhật menu điều hướng nếu có token Admin
   */
  @Put()
  @UseGuards(AdminAuthGuard)
  async updateNavigationSettings(@Body() dto: UpdateNavigationSettingsDto) {
    return this.service.updateNavigationSettings(dto);
  }
}

