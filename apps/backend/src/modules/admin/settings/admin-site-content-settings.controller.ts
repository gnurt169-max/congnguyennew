import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { SiteContentSettingsService } from './site-content-settings.service';
import { UpdateSiteContentSettingsDto } from './dto/site-content-settings.dto';

@Controller('admin/settings/content')
@UseGuards(AdminAuthGuard)
export class AdminSiteContentSettingsController {
  constructor(private readonly service: SiteContentSettingsService) {}

  @Get()
  async getSiteContentSettings() {
    return this.service.getSiteContentSettings();
  }

  @Put()
  async updateSiteContentSettings(@Body() dto: UpdateSiteContentSettingsDto) {
    return this.service.updateSiteContentSettings(dto);
  }
}
