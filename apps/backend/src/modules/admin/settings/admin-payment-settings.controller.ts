import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { PaymentSettingsService } from './payment-settings.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';

@Controller('admin/settings/payment')
@UseGuards(AdminAuthGuard)
export class AdminPaymentSettingsController {
  private readonly logger = new Logger(AdminPaymentSettingsController.name);

  constructor(private readonly service: PaymentSettingsService) {}

  @Get()
  async getPaymentConfig() {
    return this.service.getPaymentConfig();
  }

  @Put()
  async updatePaymentConfig(@Body() dto: UpdatePaymentConfigDto) {
    this.logger.log(`[Incoming Payload Payment]: ${JSON.stringify(dto)}`);
    console.log('[AdminPaymentSettingsController] Incoming Payload:', dto);
    return this.service.updatePaymentConfig(dto);
  }
}
