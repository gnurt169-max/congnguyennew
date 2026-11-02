import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  OrderStatus,
  OrderType,
  PaymentMilestoneType,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';

import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly repository: OrdersRepository,
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Tạo đơn hàng mới với cơ chế ĐÓNG BĂNG DỮ LIỆU (Data Snapshotting)
   * và thiết lập các đợt thanh toán (Milestone Payments: Cọc 30-50%)
   */
  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    const preparedOrderItems: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      variantName?: string;
      sku: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      totalPrice: Prisma.Decimal;
      specsSnapshot: Prisma.InputJsonValue;
      warrantyTermsSnapshot?: string;
    }> = [];

    let subtotal = new Prisma.Decimal(0);
    let hasQuoteOnlyMachine = false;

    // 1. Snapshot giá và thông số kỹ thuật từng thiết bị
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { brand: true, category: true },
      });

      if (!product) {
        throw new BadRequestException(`Không tìm thấy sản phẩm ID: "${item.productId}"`);
      }

      if (product.isQuoteOnly) {
        hasQuoteOnlyMachine = true;
      }

      let variant = null;
      let sku = product.modelCode || `PROD-${product.id.slice(0, 8)}`;
      let variantName = undefined;
      let unitPrice = product.basePrice || new Prisma.Decimal(0);
      let powerType = null;
      let powerKw = null;
      let weightKg = null;
      let dimensions = null;

      if (item.variantId) {
        variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant) {
          throw new BadRequestException(`Không tìm thấy biến thể ID: "${item.variantId}"`);
        }

        sku = variant.sku;
        variantName = variant.name;
        if (variant.price) unitPrice = variant.price;
        powerType = variant.powerType;
        powerKw = variant.powerKw;
        weightKg = variant.weightKg;
        dimensions = variant.dimensions;
      }

      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const itemTotal = unitPrice.mul(quantity);
      subtotal = subtotal.plus(itemTotal);

      // --- BẮT BUỘC SNAPSHOT: Đóng băng toàn bộ dữ liệu lúc chốt đơn ---
      const frozenSpecs: Prisma.InputJsonObject = {
        productName: product.name,
        modelCode: product.modelCode,
        variantName: variantName,
        sku: sku,
        powerType: powerType,
        powerKw: powerKw ? Number(powerKw) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        dimensions: dimensions,
        brandName: product.brand?.name,
        categoryName: product.category?.name,
        warrantyMonths: product.warrantyMonths,
        specSheetPdfUrl: product.specSheetPdfUrl,
        frozenAt: new Date().toISOString(),
      };

      preparedOrderItems.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variantName,
        sku: sku,
        unitPrice: unitPrice,
        quantity: quantity,
        totalPrice: itemTotal,
        specsSnapshot: frozenSpecs,
        warrantyTermsSnapshot: `Bảo hành chính hãng ${product.warrantyMonths} tháng. Hỗ trợ kỹ thuật lắp đặt và chạy thử nghiệm thu tại xưởng.`,
      });
    }

    // 2. Tính toán tài chính & tiền cọc
    // Thuế VAT 10% nếu yêu cầu xuất hóa đơn công ty
    const vatRate = dto.isCompanyInvoice ? 0.1 : 0;
    const vatAmount = subtotal.mul(vatRate);
    const totalAmount = subtotal.plus(vatAmount);

    // Xác định tỷ lệ đặt cọc: 30%, 50% hoặc 100%
    const depositPercent =
      dto.depositPercent === 50 ? 50 : dto.depositPercent === 100 ? 100 : 30;
    const depositDecimal = new Prisma.Decimal(depositPercent);

    const depositAmount = totalAmount.mul(depositDecimal.div(100));
    const remainingAmount = totalAmount.minus(depositAmount);

    // 3. Sinh mã đơn hàng & mã thanh toán
    const orderCode = await this.repository.generateOrderCode();
    const paymentCode = await this.repository.generatePaymentCode();

    const orderType = dto.quotationRequestId
      ? OrderType.RFQ_CONVERSION
      : hasQuoteOnlyMachine
      ? OrderType.PROJECT_CONTRACT
      : OrderType.INSTANT_SALE;

    // 4. Lưu đơn hàng và đợt thanh toán 1 vào database
    const orderData: Prisma.OrderCreateInput = {
      orderCode,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      companyName: dto.companyName,
      taxCode: dto.taxCode,
      shippingAddress: dto.shippingAddress,
      billingAddress: dto.billingAddress,
      orderType,
      status: OrderStatus.PENDING_DEPOSIT,
      totalAmount,
      depositRequiredPercent: depositDecimal,
      depositAmount,
      paidAmount: new Prisma.Decimal(0),
      remainingAmount,
      isDepositSettled: false,
      isFullyPaid: false,
      notes: dto.notes,
      quotationRequest: dto.quotationRequestId
        ? { connect: { id: dto.quotationRequestId } }
        : undefined,
      items: {
        create: preparedOrderItems.map((pi) => ({
          productName: pi.productName,
          variantName: pi.variantName,
          sku: pi.sku,
          unitPrice: pi.unitPrice,
          quantity: pi.quantity,
          totalPrice: pi.totalPrice,
          specsSnapshot: pi.specsSnapshot,
          warrantyTermsSnapshot: pi.warrantyTermsSnapshot,
          product: { connect: { id: pi.productId } },
          variant: pi.variantId ? { connect: { id: pi.variantId } } : undefined,
        })),
      },
      payments: {
        create: [
          {
            paymentCode,
            milestoneType: PaymentMilestoneType.DEPOSIT_STAGE_1,
            amount: depositAmount,
            paymentMethod: dto.paymentMethod || PaymentMethod.BANK_TRANSFER_DOMESTIC,
            status: PaymentStatus.PENDING,
            notes: `Đặt cọc Đợt 1 (${depositPercent}%) cho đơn hàng thiết bị ${orderCode}`,
          },
        ],
      },
    };

    const createdOrder = await this.repository.create(orderData);

    this.logger.log(
      `Tạo đơn hàng thành công: Mã "${createdOrder.orderCode}", Tổng tiền: ${totalAmount} VNĐ, Cọc Đợt 1: ${depositAmount} VNĐ`,
    );

    return {
      orderCode: createdOrder.orderCode,
      customerName: createdOrder.customerName,
      customerPhone: createdOrder.customerPhone,
      companyName: createdOrder.companyName,
      status: createdOrder.status,
      totalAmount: createdOrder.totalAmount,
      depositPercent: depositPercent,
      depositAmount: createdOrder.depositAmount,
      remainingAmount: createdOrder.remainingAmount,
      initialPaymentCode: paymentCode,
      createdAt: createdOrder.createdAt,
    };
  }

  /**
   * Tra cứu chi tiết đơn hàng, snapshots thông số và lịch sử thanh toán đợt
   */
  async getOrderByCode(orderCode: string) {
    const order = await this.repository.findByOrderCode(orderCode);
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã: "${orderCode}"`);
    }

    const statusMap: Record<OrderStatus, { title: string; step: number; description: string }> = {
      [OrderStatus.DRAFT]: {
        title: 'Bản nháp',
        step: 0,
        description: 'Đơn hàng đang ở trạng thái nháp.',
      },
      [OrderStatus.PENDING_DEPOSIT]: {
        title: 'Chờ đặt cọc đợt 1',
        step: 1,
        description: 'Khách hàng chuyển khoản đặt cọc đợt 1 để giữ máy hoặc tiến hành chế tạo.',
      },
      [OrderStatus.PROCESSING_MANUFACTURE]: {
        title: 'Đang chuẩn bị / Sản xuất máy',
        step: 2,
        description: 'Máy móc đang được nhập khẩu, lắp ráp hoặc kiểm định linh kiện điện 3 pha.',
      },
      [OrderStatus.READY_FOR_DELIVERY]: {
        title: 'Sẵn sàng xuất xưởng',
        step: 3,
        description: 'Thiết bị đã kiểm định QC đạt chuẩn, sẵn sàng bốc xếp lên xe vận chuyển tới xưởng.',
      },
      [OrderStatus.DELIVERED_TESTING]: {
        title: 'Bàn giao & Vận hành thử',
        step: 4,
        description: 'Kỹ sư đang lắp đặt máy tại xưởng, cân chỉnh nguồn điện và nướng thử mẻ bánh đầu tiên.',
      },
      [OrderStatus.COMPLETED]: {
        title: 'Hoàn tất nghiệm thu',
        step: 5,
        description: 'Khách hàng ký biên bản nghiệm thu, tất toán phần tiền còn lại và nhận sổ bảo hành.',
      },
      [OrderStatus.CANCELLED]: {
        title: 'Đã hủy',
        step: -1,
        description: 'Đơn hàng đã hủy theo yêu cầu của hai bên.',
      },
    };

    return {
      ...order,
      statusDetail: statusMap[order.status],
    };
  }

  /**
   * Tra cứu trạng thái phiên thanh toán thời gian thực (Checkout Session State Machine)
   * Vòng đời trạng thái: pending | paid | expired | failed
   */
  async getCheckoutSessionStatus(sessionId: string) {
    const cleanCode = sessionId.trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderCode: cleanCode }, { id: cleanCode }],
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy phiên thanh toán hoặc đơn hàng: "${cleanCode}"`);
    }

    const SESSION_TTL_MS = 15 * 60 * 1000; // 15 phút đếm ngược
    const expiresAt = new Date(order.createdAt.getTime() + SESSION_TTL_MS);
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    let status: 'pending' | 'paid' | 'expired' | 'failed' = 'pending';
    let statusText = 'Vui lòng chuyển khoản đặt cọc để giữ máy.';

    if (
      order.isDepositSettled ||
      order.status === OrderStatus.PROCESSING_MANUFACTURE ||
      order.status === OrderStatus.READY_FOR_DELIVERY ||
      order.status === OrderStatus.DELIVERED_TESTING ||
      order.status === OrderStatus.COMPLETED
    ) {
      status = 'paid';
      statusText = 'Thanh toán cọc thành công! Máy đã được giữ cho bạn.';
    } else if (order.status === OrderStatus.CANCELLED) {
      status = 'failed';
      statusText = 'Phiên đặt máy đã bị hủy.';
    } else if (remainingSeconds <= 0) {
      // Tự động nhả máy & hủy phiên nếu quá 15 phút chưa nhận được cọc
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      status = 'expired';
      statusText = 'Phiên giữ máy đã hết hạn do chưa nhận được cọc. Máy đã được mở lại cho khách hàng khác.';
    }

    const latestPayment = order.payments?.[0];

    return {
      sessionId: order.orderCode,
      orderCode: order.orderCode,
      status,
      statusText,
      isDepositSettled: order.isDepositSettled,
      totalAmount: Number(order.totalAmount),
      depositAmount: Number(order.depositAmount),
      remainingAmount: Number(order.remainingAmount),
      depositPercent: Number(order.depositRequiredPercent),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      remainingSeconds,
      paymentMethod: latestPayment?.paymentMethod || 'BANK_TRANSFER_DOMESTIC',
      paidAt: order.isDepositSettled
        ? latestPayment?.confirmedAt?.toISOString() || order.updatedAt.toISOString()
        : null,
      items: order.items.map((i) => ({
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    };
  }

  /**
   * Mô phỏng tiền cọc vào tài khoản (Dành cho test webhook / IPN / Demo tức thì)
   */
  async simulateDepositSuccess(sessionId: string) {
    const cleanCode = sessionId.trim();
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ orderCode: cleanCode }, { id: cleanCode }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: "${cleanCode}"`);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        isDepositSettled: true,
        status: OrderStatus.PROCESSING_MANUFACTURE,
        paidAmount: order.depositAmount,
      },
    });

    await this.prisma.orderPayment.create({
      data: {
        paymentCode: `PAY-SIM-${Date.now()}`,
        orderId: order.id,
        milestoneType: PaymentMilestoneType.DEPOSIT_STAGE_1,
        amount: order.depositAmount,
        paymentMethod: PaymentMethod.BANK_TRANSFER_DOMESTIC,
        status: PaymentStatus.CONFIRMED,
        transactionRef: `SIM-BANK-${Date.now()}`,
        confirmedAt: new Date(),
        notes: 'Xác nhận cọc tự động qua hệ thống kiểm tra giao dịch',
      },
    });

    // Trừ tồn kho nguyên tử (Atomic Stock Deduction) chống Race-condition
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.productId) {
          await this.productsService.deductStockAtomic(item.productId, item.quantity);
        }
      }
    }

    return {
      success: true,
      orderCode: updated.orderCode,
      status: 'paid',
      message: 'Xác nhận đặt cọc thành công!',
    };
  }
}
