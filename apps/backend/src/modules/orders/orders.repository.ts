import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã đơn hàng ngẫu nhiên chống trùng lặp theo mô hình Phiên thanh toán:
   * Định dạng: DH-CN-XXXXXX (với X là các ký tự chữ/số ngẫu nhiên, ví dụ: DH-CN-839210)
   */
  async generateOrderCode(): Promise<string> {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let isUnique = false;
    let orderCode = '';

    while (!isUnique) {
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      orderCode = `DH-CN-${randomPart}`;

      const existing = await this.prisma.order.findUnique({
        where: { orderCode },
        select: { id: true },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return orderCode;
  }

  /**
   * Sinh mã giao dịch thanh toán đợt: PAY-YYYYMM-XXXX
   */
  async generatePaymentCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PAY-${year}${month}-`;

    const latestPayment = await this.prisma.orderPayment.findFirst({
      where: { paymentCode: { startsWith: prefix } },
      orderBy: { paymentCode: 'desc' },
      select: { paymentCode: true },
    });

    let sequence = 1;
    if (latestPayment && latestPayment.paymentCode) {
      const parts = latestPayment.paymentCode.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async findByOrderCode(orderCode: string) {
    return this.prisma.order.findUnique({
      where: { orderCode: orderCode.trim() },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                modelCode: true,
                thumbnail: true,
                brand: { select: { name: true, originCountry: true } },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                powerType: true,
                powerKw: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
        customer: true,
        quotationRequest: {
          select: { code: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async findMany(params: {
    search?: string;
    status?: Prisma.EnumOrderStatusFilter | OrderStatus;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.OrderWhereInput = {};

    if (params.status) where.status = params.status;
    if (params.search) {
      const q = params.search.trim();
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
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }
}
