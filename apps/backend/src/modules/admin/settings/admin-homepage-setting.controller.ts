import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { HomepageSettingService } from './homepage-setting.service';
import { UpdateHomepageConfigDto } from './dto/homepage-setting.dto';

@Controller('admin/settings/homepage')
@UseGuards(AdminAuthGuard)
export class AdminHomepageSettingController {
  constructor(private readonly service: HomepageSettingService) {}

  @Get()
  async getHomepageConfig() {
    return this.service.getHomepageConfig();
  }

  @Put()
  async updateHomepageConfig(@Body() dto: UpdateHomepageConfigDto) {
    return this.service.updateHomepageConfig(dto);
  }

  @Post('reset')
  async resetHomepageConfig() {
    return this.service.resetHomepageConfig();
  }
}

