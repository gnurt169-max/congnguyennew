import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ContactSettingsService } from './contact-settings.service';
import { UpdateContactSettingsDto } from './dto/contact-settings.dto';

@Controller('admin/settings/contact')
@UseGuards(AdminAuthGuard)
export class AdminContactSettingsController {
  private readonly logger = new Logger(AdminContactSettingsController.name);

  constructor(private readonly service: ContactSettingsService) {}

  @Get()
  async getContactSettings() {
    return this.service.getContactSettings();
  }

  @Put()
  async updateContactSettings(@Body() dto: UpdateContactSettingsDto) {
    this.logger.log(`[Incoming Payload Contact]: ${JSON.stringify(dto)}`);
    console.log('[AdminContactSettingsController] Incoming Payload:', dto);
    return this.service.updateContactSettings(dto);
  }
}
