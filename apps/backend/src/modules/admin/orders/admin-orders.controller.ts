import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateOrderDeliveryDto } from './dto/update-order-delivery.dto';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

@Controller('admin/orders')
@UseGuards(AdminAuthGuard)
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/admin/orders
   * Lấy danh sách đơn hàng kèm tính toán tỷ lệ thanh toán cọc và công nợ còn lại
   */
  @Get()
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(Math.max(limit || 10, 1), 50);
    const skip = (safePage - 1) * safeLimit;
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (search) {
      const q = search.trim();
      where.OR = [
        { orderCode: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);

    // Format bổ sung % đã thu tiền thực tế
    const formatted = items.map((o) => {
      const totalAmount = Number(o.totalAmount);
      const paidAmount = Number(o.paidAmount);
      const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      return {
        ...o,
        paidPercent,
      };
    });

    return {
      items: formatted,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  /**
   * GET /api/v1/admin/orders/:id
   * Chi tiết đơn hàng, snapshot thông số máy và lịch sử các đợt thanh toán
   */
  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'asc' },
        },
        customer: true,
        quotationRequest: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có ID: "${id}"`);
    }

    const totalAmount = Number(order.totalAmount);
    const paidAmount = Number(order.paidAmount);
    const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    return {
      ...order,
      paidPercent,
    };
  }

  /**
   * POST /api/v1/admin/orders/:id/payments
   * Ghi nhận đợt thanh toán mới từ khách hàng và tự động cập nhật công nợ
   */
  @Post(':id/payments')
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có ID: "${id}"`);
    }

    const paymentAmount = new Prisma.Decimal(dto.amount);
    const newPaidAmount = order.paidAmount.plus(paymentAmount);
    const newRemainingAmount = order.totalAmount.minus(newPaidAmount);
    const isFullyPaid = newRemainingAmount.lessThanOrEqualTo(0);
    const isDepositSettled = newPaidAmount.greaterThanOrEqualTo(order.depositAmount);

    // Sinh mã thanh toán PAY-YYYYMM-XXXX
    const now = new Date();
    const prefix = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const randomSeq = String(Math.floor(Math.random() * 9000) + 1000);
    const paymentCode = `${prefix}${randomSeq}`;

    // Tạo bản ghi thanh toán
    const payment = await this.prisma.orderPayment.create({
      data: {
        paymentCode,
        orderId: id,
        milestoneType: dto.milestoneType,
        amount: paymentAmount,
        paymentMethod: dto.paymentMethod,
        status: dto.status || PaymentStatus.CONFIRMED,
        transactionRef: dto.transactionRef,
        notes: dto.notes,
        confirmedAt: dto.status === PaymentStatus.CONFIRMED ? new Date() : undefined,
      },
    });

    // Cập nhật trạng thái và số dư đơn hàng
    let nextStatus = order.status;
    if (order.status === OrderStatus.PENDING_DEPOSIT && isDepositSettled) {
      nextStatus = OrderStatus.PROCESSING_MANUFACTURE; // Sau khi cọc, chuyển sang chuẩn bị máy
    }
    if (isFullyPaid) {
      nextStatus = OrderStatus.COMPLETED;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount.greaterThan(0) ? newRemainingAmount : new Prisma.Decimal(0),
        isDepositSettled,
        isFullyPaid,
        status: nextStatus,
      },
      include: {
        payments: { orderBy: { createdAt: 'asc' } },
        items: true,
      },
    });

    return {
      order: updatedOrder,
      recordedPayment: payment,
    };
  }

  /**
   * PUT /api/v1/admin/orders/:id/status
   * Cập nhật tiến độ chế tạo, xuất xưởng, bàn giao chạy thử và nghiệm thu
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDeliveryDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có ID: "${id}"`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes ? `${order.notes || ''}\n[Cập nhật trạng thái]: ${dto.notes}` : undefined,
      },
      include: {
        payments: true,
        items: true,
      },
    });
  }
}
