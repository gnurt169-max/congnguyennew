import { Controller, Get } from '@nestjs/common';
import { SiteContentSettingsService } from './site-content-settings.service';

@Controller('settings/content')
export class PublicSiteContentSettingsController {
  constructor(private readonly service: SiteContentSettingsService) {}

  /**
   * GET /api/v1/settings/content
   * API công khai cho trang chủ Storefront và Footer lấy dữ liệu hiển thị động
   */
  @Get()
  async getSiteContentSettings() {
    return this.service.getSiteContentSettings();
  }
}
