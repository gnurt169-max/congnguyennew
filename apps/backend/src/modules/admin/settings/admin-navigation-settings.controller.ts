import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { NavigationSettingService } from './navigation-setting.service';
import { UpdateNavigationSettingsDto } from './dto/navigation-setting.dto';

@Controller(['admin/settings/navigation', 'admin/settings/menu'])
@UseGuards(AdminAuthGuard)
export class AdminNavigationSettingsController {
  constructor(private readonly service: NavigationSettingService) {}

  @Get()
  async getNavigationSettings() {
    return this.service.getNavigationSettings();
  }

  @Put()
  async updateNavigationSettings(@Body() dto: UpdateNavigationSettingsDto) {
    return this.service.updateNavigationSettings(dto);
  }

  @Post('reset')
  async resetNavigationSettings() {
    return this.service.resetNavigationSettings();
  }
}

