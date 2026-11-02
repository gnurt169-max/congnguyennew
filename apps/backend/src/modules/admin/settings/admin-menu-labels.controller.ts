import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { GeneralSettingsService } from './general-settings.service';
import { UpdateAdminMenuLabelDto } from './dto/admin-menu-labels.dto';

@Controller(['admin/settings/menu-labels', 'settings/admin-menu-labels', 'admin/settings/admin-menu-labels'])
@UseGuards(AdminAuthGuard)
export class AdminMenuLabelsController {
  constructor(private readonly service: GeneralSettingsService) {}

  /**
   * GET /api/v1/admin/settings/menu-labels (hoặc /api/v1/settings/admin-menu-labels)
   * Lấy cấu hình nhãn menu thanh Sidebar Admin
   */
  @Get()
  async getMenuLabels() {
    return this.service.getAdminMenuLabels();
  }

  /**
   * PUT /api/v1/admin/settings/menu-labels (hoặc /api/v1/settings/admin-menu-labels)
   * Cập nhật nhãn menu thanh Sidebar Admin
   */
  @Put()
  async updateMenuLabels(@Body() dto: UpdateAdminMenuLabelDto) {
    return this.service.updateAdminMenuLabels(dto);
  }

  /**
   * POST /api/v1/admin/settings/menu-labels/reset
   * Khôi phục nhãn mặc định
   */
  @Post('reset')
  async resetMenuLabels(@Body() body?: { key?: string }) {
    return this.service.resetAdminMenuLabels(body?.key);
  }
}

