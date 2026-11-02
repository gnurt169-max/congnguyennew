import { Controller, Get, Post, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * API GET /api/v1/checkout/status/:sessionId
   * Polling kiểm tra trạng thái phiên thanh toán thời gian thực
   * Vòng đời: pending -> paid | expired | failed
   */
  @Get('status/:sessionId')
  async getCheckoutStatus(@Param('sessionId') sessionId: string) {
    return this.ordersService.getCheckoutSessionStatus(sessionId);
  }

  /**
   * API POST /api/v1/checkout/simulate-deposit/:sessionId
   * Kích hoạt xác nhận cọc giả lập cho mục đích demo / webhook test
   */
  @Post('simulate-deposit/:sessionId')
  async simulateDeposit(@Param('sessionId') sessionId: string) {
    return this.ordersService.simulateDepositSuccess(sessionId);
  }
}
