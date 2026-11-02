import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { VisibilitySettingService } from './visibility-setting.service';
import { UpdateVisibilityDto } from './dto/visibility-setting.dto';

@Controller('admin/settings/visibility')
@UseGuards(AdminAuthGuard)
export class AdminVisibilitySettingsController {
  constructor(private readonly service: VisibilitySettingService) {}

  @Get()
  async getVisibility() {
    return this.service.getVisibility();
  }

  @Put()
  async updateVisibility(@Body() dto: UpdateVisibilityDto) {
    return this.service.updateVisibility(dto);
  }

  @Post('reset')
  async resetVisibility() {
    return this.service.resetVisibility();
  }
}
