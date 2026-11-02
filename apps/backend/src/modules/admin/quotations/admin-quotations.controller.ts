import {
  Controller,
  Get,
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
import { AdminQuoteRfqDto } from './dto/admin-quote-rfq.dto';
import { UpdateQuotationStatusDto } from '../../quotations/dto/update-quotation-status.dto';
import { Prisma, RfqStatus } from '@prisma/client';

@Controller('admin/quotations')
@UseGuards(AdminAuthGuard)
export class AdminQuotationsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/admin/quotations
   * Lấy danh sách yêu cầu báo giá kỹ thuật, hỗ trợ lọc trạng thái và tìm kiếm
   */
  @Get()
  async getQuotations(
    @Query('status') status?: RfqStatus,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(Math.max(limit || 10, 1), 50);
    const skip = (safePage - 1) * safeLimit;
    const where: Prisma.QuotationRequestWhereInput = {};

    if (status) where.status = status;
    if (search) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quotationRequest.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, modelCode: true, thumbnail: true },
              },
              variant: {
                select: { sku: true, name: true, powerType: true, powerKw: true },
              },
            },
          },
          assignedStaff: {
            select: { id: true, fullName: true, phoneNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.quotationRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  /**
   * GET /api/v1/admin/quotations/:id
   * Xem chi tiết thông số xưởng, thông tin máy và lịch sử báo giá
   */
  @Get(':id')
  async getQuotationDetail(@Param('id') id: string) {
    const rfq = await this.prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        assignedStaff: true,
        orders: {
          select: { id: true, orderCode: true, status: true, totalAmount: true },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException(`Không tìm thấy yêu cầu báo giá có ID: "${id}"`);
    }

    return rfq;
  }

  /**
   * PUT /api/v1/admin/quotations/:id/quote
   * Kỹ sư nhập đơn giá chào thầu (offeredUnitPrice) và chuyển trạng thái sang QUOTE_SENT
   */
  @Put(':id/quote')
  async submitQuote(
    @Param('id') id: string,
    @Body() dto: AdminQuoteRfqDto,
  ) {
    const rfq = await this.prisma.quotationRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!rfq) {
      throw new NotFoundException(`Không tìm thấy yêu cầu báo giá có ID: "${id}"`);
    }

    let calculatedTotal = new Prisma.Decimal(0);

    // Cập nhật giá chào thầu từng item
    for (const quoteItem of dto.items) {
      const existingItem = rfq.items.find((it) => it.id === quoteItem.id);
      if (existingItem) {
        const unitPrice = new Prisma.Decimal(quoteItem.offeredUnitPrice);
        calculatedTotal = calculatedTotal.plus(unitPrice.mul(existingItem.requestedQuantity));

        await this.prisma.quotationItem.update({
          where: { id: quoteItem.id },
          data: {
            offeredUnitPrice: unitPrice,
            technicalNotes: quoteItem.technicalNotes,
          },
        });
      }
    }

    const updated = await this.prisma.quotationRequest.update({
      where: { id },
      data: {
        status: dto.status || RfqStatus.QUOTE_SENT,
        internalTechnicalNotes: dto.internalTechnicalNotes,
        estimatedTotal: calculatedTotal,
        assignedStaffId: dto.assignedStaffId,
      },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        assignedStaff: true,
      },
    });

    return updated;
  }

  /**
   * PUT /api/v1/admin/quotations/:id/status
   * Cập nhật nhanh trạng thái xử lý RFQ
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
  ) {
    const rfq = await this.prisma.quotationRequest.findUnique({ where: { id } });
    if (!rfq) {
      throw new NotFoundException(`Không tìm thấy yêu cầu báo giá có ID: "${id}"`);
    }

    return this.prisma.quotationRequest.update({
      where: { id },
      data: {
        status: dto.status,
        internalTechnicalNotes: dto.internalTechnicalNotes,
        assignedStaffId: dto.assignedStaffId,
      },
    });
  }
}
