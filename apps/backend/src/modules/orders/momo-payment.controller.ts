import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';

@Controller('payments/momo')
export class MomoPaymentController {
  private readonly logger = new Logger(MomoPaymentController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * API Webhook IPN nhận kết quả thanh toán ngầm từ MoMo
   * URL cấu hình MoMo: https://congnguyen.com.vn/api/payments/momo/ipn
   * Route NestJS: POST /api/v1/payments/momo/ipn
   */
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleMomoIpn(@Body() payload: any) {
    this.logger.log(`[MoMo IPN Webhook] Nhận payload: ${JSON.stringify(payload)}`);

    const {
      orderId,
      transId,
      resultCode,
      message,
      amount,
      extraData,
    } = payload || {};

    try {
      // resultCode === 0 hoặc resultCode === '0' nghĩa là giao dịch thành công
      const isSuccess = Number(resultCode) === 0;

      if (orderId) {
        // Tìm đơn hàng tương ứng trong DB
        const order = await this.prisma.order.findFirst({
          where: {
            OR: [
              { id: orderId },
              { orderCode: orderId },
            ],
          },
          include: {
            items: true,
          },
        });

        if (order) {
          if (isSuccess) {
            this.logger.log(`[MoMo IPN] Đơn hàng ${order.orderCode} thanh toán thành công qua MoMo (Mã GD: ${transId})`);

            // Tạo bản ghi OrderPayment xác nhận đã thanh toán
            await this.prisma.orderPayment.create({
              data: {
                paymentCode: `PAY-MOMO-${Date.now()}`,
                orderId: order.id,
                milestoneType: 'DEPOSIT_STAGE_1',
                amount: amount ? Number(amount) : order.depositAmount,
                paymentMethod: 'ONLINE_MOMO',
                status: 'CONFIRMED',
                transactionRef: transId ? String(transId) : `MOMO-${Date.now()}`,
                notes: `MoMo IPN Webhook: ${message || 'Thành công'}`,
                confirmedAt: new Date(),
              },
            });

            // Cập nhật trạng thái đơn hàng: đã cọc
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                isDepositSettled: true,
                status: 'PROCESSING_MANUFACTURE',
                paidAmount: {
                  increment: amount ? Number(amount) : order.depositAmount,
                },
              },
            });

            // Tự động trừ tồn kho nguyên tử (Atomic Stock Deduction)
            if (order.items && order.items.length > 0) {
              for (const item of order.items) {
                if (item.productId) {
                  await this.productsService.deductStockAtomic(item.productId, item.quantity);
                }
              }
            }
          } else {
            this.logger.warn(`[MoMo IPN] Giao dịch MoMo không thành công cho đơn ${order.orderCode}: ${message} (code ${resultCode})`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`[MoMo IPN] Lỗi xử lý webhook: ${err.message}`);
    }

    // Trả về đúng định dạng MoMo IPN mong muốn
    return {
      resultCode: 0,
      message: 'IPN processed successfully',
    };
  }

  /**
   * API Callback khi người dùng hoàn tất thanh toán trên MoMo và được chuyển hướng về
   * URL: https://congnguyen.com.vn/payment/momo-return
   * Route NestJS: GET /api/v1/payments/momo/return
   */
  @Get('return')
  async handleMomoReturn(@Query() query: any, @Res() res: Response) {
    this.logger.log(`[MoMo Return Callback] Query: ${JSON.stringify(query)}`);

    const redirectBase = process.env.MOMO_REDIRECT_URL || 'https://congnguyen.com.vn/payment/momo-return';
    const searchParams = new URLSearchParams(query).toString();
    const targetUrl = searchParams ? `${redirectBase}?${searchParams}` : redirectBase;

    return res.redirect(targetUrl);
  }

  /**
   * API kiểm tra thông tin cấu hình MoMo URLs hiện tại
   * Route: GET /api/v1/payments/momo/urls
   */
  @Get('urls')
  getMomoUrls() {
    return {
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'https://congnguyen.com.vn/payment/momo-return',
      ipnUrl: process.env.MOMO_IPN_URL || 'https://congnguyen.com.vn/api/payments/momo/ipn',
      environment: process.env.MOMO_ENVIRONMENT || 'production',
      partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529',
    };
  }
}
