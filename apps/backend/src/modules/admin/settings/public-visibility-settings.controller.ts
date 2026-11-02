import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { VisibilitySettingService } from './visibility-setting.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UpdateVisibilityDto } from './dto/visibility-setting.dto';

@Controller('settings/visibility')
export class PublicVisibilitySettingsController {
  constructor(private readonly service: VisibilitySettingService) {}

  /**
   * GET /api/v1/settings/visibility
   * API công khai cho Storefront tải trạng thái ẩn/hiện các vùng thông tin
   */
  @Get()
  async getVisibility() {
    return this.service.getVisibility();
  }

  /**
   * PUT /api/v1/settings/visibility
   * Cho phép cập nhật nếu có Admin Token
   */
  @Put()
  @UseGuards(AdminAuthGuard)
  async updateVisibility(@Body() dto: UpdateVisibilityDto) {
    return this.service.updateVisibility(dto);
  }
}
