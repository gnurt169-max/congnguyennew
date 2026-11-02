import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * API POST /api/v1/orders
   * Tạo đơn hàng mới, đóng băng thông số kỹ thuật (specsSnapshot) và thiết lập cọc nhiều đợt
   */
  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  /**
   * API GET /api/v1/orders/status/:orderNumber
   * Polling kiểm tra trạng thái thanh toán thời gian thực theo mã đơn
   */
  @Get('status/:orderNumber')
  async getOrderStatus(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getCheckoutSessionStatus(orderNumber);
  }

  /**
   * API POST /api/v1/orders/simulate-deposit/:orderNumber
   * Kích hoạt xác nhận cọc giả lập cho mục đích demo / webhook test
   */
  @Post('simulate-deposit/:orderNumber')
  async simulateDeposit(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.simulateDepositSuccess(orderNumber);
  }

  /**
   * API GET /api/v1/orders/:orderNumber
   * Tra cứu chi tiết đơn hàng và lịch sử thanh toán từng đợt theo mã (Ví dụ: DH-CN-839210)
   */
  @Get(':orderNumber')
  async getOrderByCode(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderByCode(orderNumber);
  }
}
