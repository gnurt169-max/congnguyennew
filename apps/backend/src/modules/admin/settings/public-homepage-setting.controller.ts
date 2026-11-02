import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { HomepageSettingService } from './homepage-setting.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { UpdateHomepageConfigDto } from './dto/homepage-setting.dto';

@Controller('settings/homepage')
export class PublicHomepageSettingController {
  constructor(private readonly service: HomepageSettingService) {}

  /**
   * GET /api/v1/settings/homepage
   * API công khai cho Storefront và khách hàng lấy dữ liệu Hero Section
   */
  @Get()
  async getHomepageConfig() {
    return this.service.getHomepageConfig();
  }

  /**
   * PUT /api/v1/settings/homepage
   * Cho phép cập nhật nếu có Admin Token
   */
  @Put()
  @UseGuards(AdminAuthGuard)
  async updateHomepageConfig(@Body() dto: UpdateHomepageConfigDto) {
    return this.service.updateHomepageConfig(dto);
  }
}

