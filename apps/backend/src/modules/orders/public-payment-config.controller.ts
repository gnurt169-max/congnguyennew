import { Controller, Get } from '@nestjs/common';
import { PaymentSettingsService } from '../admin/settings/payment-settings.service';

@Controller('payment/config')
export class PublicPaymentConfigController {
  constructor(private readonly service: PaymentSettingsService) {}

  /**
   * API công khai cho Frontend lấy thông tin tài khoản (số tài khoản, tên ngân hàng) để hiển thị lúc thanh toán
   */
  @Get()
  async getPublicPaymentConfig() {
    return this.service.getPaymentConfig();
  }
}
