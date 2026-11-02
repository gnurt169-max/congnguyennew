import { Controller, Get } from '@nestjs/common';
import { GeneralSettingsService } from './general-settings.service';

@Controller(['settings/menu-labels', 'public/menu-labels'])
export class PublicMenuLabelsController {
  constructor(private readonly service: GeneralSettingsService) {}

  /**
   * GET /api/v1/settings/menu-labels
   * Lấy cấu hình nhãn menu (công khai / client)
   */
  @Get()
  async getMenuLabels() {
    return this.service.getAdminMenuLabels();
  }
}

