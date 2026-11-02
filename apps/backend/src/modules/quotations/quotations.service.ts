import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { QuotationsRepository } from './quotations.repository';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RfqStatus } from '@prisma/client';

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(
    private readonly repository: QuotationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Tạo mới yêu cầu báo giá kỹ thuật B2B (RFQ)
   * Tự động sinh mã định dạng: BG-YYYYMM-XXXX
   * Tính toán giá trị ước tính và lưu chi tiết thiết bị yêu cầu
   */
  async createQuotation(dto: CreateQuotationDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Yêu cầu báo giá phải có ít nhất 1 thiết bị');
    }

    // 1. Kiểm tra tính hợp lệ của từng sản phẩm/biến thể
    const preparedItems: Array<{
      productId: string;
      variantId?: string;
      requestedQuantity: number;
      targetUnitPrice?: Prisma.Decimal;
      technicalNotes?: string;
    }> = [];

    let totalEstimated = new Prisma.Decimal(0);

    for (const item of dto.items) {
      let resolvedProductId = item.productId;
      let referencePrice: Prisma.Decimal | null = null;

      // Nếu có variantId, truy xuất thông tin biến thể
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, productId: true, price: true },
        });

        if (!variant) {
          throw new BadRequestException(
            `Không tìm thấy biến thể thiết bị có ID: "${item.variantId}"`,
          );
        }

        resolvedProductId = variant.productId;
        referencePrice = variant.price;
      } else if (resolvedProductId) {
        // Nếu chỉ có productId
        const product = await this.prisma.product.findUnique({
          where: { id: resolvedProductId },
          select: { id: true, basePrice: true },
        });

        if (!product) {
          throw new BadRequestException(
            `Không tìm thấy thiết bị có ID: "${resolvedProductId}"`,
          );
        }

        referencePrice = product.basePrice;
      } else {
        throw new BadRequestException(
          'Mỗi thiết bị trong yêu cầu báo giá phải có ít nhất productId hoặc variantId',
        );
      }

      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unitPrice =
        item.targetUnitPrice !== undefined
          ? new Prisma.Decimal(item.targetUnitPrice)
          : referencePrice || new Prisma.Decimal(0);

      // Cộng dồn giá trị ước tính
      totalEstimated = totalEstimated.plus(unitPrice.mul(quantity));

      preparedItems.push({
        productId: resolvedProductId,
        variantId: item.variantId,
        requestedQuantity: quantity,
        targetUnitPrice: unitPrice,
        technicalNotes: item.specialRequirements,
      });
    }

    // 2. Sinh mã báo giá tự động duy nhất (BG-YYYYMM-XXXX)
    const code = await this.repository.generateQuotationCode();

    // 3. Chuẩn bị dữ liệu lưu database
    const quotationData: Prisma.QuotationRequestCreateInput = {
      code,
      customerName: dto.contactName,
      companyName: dto.companyName,
      customerPhone: dto.phone,
      customerEmail: dto.email,
      workshopAddress: dto.installationAddress,
      province: dto.province,
      district: dto.district,
      targetPowerSupply: dto.powerSupplyType,
      dailyCapacityRequirement: dto.dailyCapacityRequirement,
      customerNotes: dto.customerNotes,
      status: RfqStatus.PENDING,
      estimatedTotal: totalEstimated.greaterThan(0) ? totalEstimated : undefined,
      items: {
        create: preparedItems.map((pi) => ({
          product: { connect: { id: pi.productId } },
          variant: pi.variantId ? { connect: { id: pi.variantId } } : undefined,
          requestedQuantity: pi.requestedQuantity,
          targetUnitPrice: pi.targetUnitPrice,
          technicalNotes: pi.technicalNotes,
        })),
      },
    };

    const createdRfq = await this.repository.create(quotationData);

    this.logger.log(
      `Đã tiếp nhận RFQ thành công: Mã "${createdRfq.code}" từ khách hàng ${dto.contactName} (${dto.phone})`,
    );

    return {
      code: createdRfq.code,
      customerName: createdRfq.customerName,
      companyName: createdRfq.companyName,
      status: createdRfq.status,
      workshopAddress: createdRfq.workshopAddress,
      targetPowerSupply: createdRfq.targetPowerSupply,
      estimatedTotal: createdRfq.estimatedTotal,
      itemCount: createdRfq.items.length,
      createdAt: createdRfq.createdAt,
    };
  }

  /**
   * Tra cứu thông tin và tiến độ báo giá theo mã RFQ
   */
  async getQuotationByCode(code: string) {
    const rfq = await this.repository.findByCode(code.trim());
    if (!rfq) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu báo giá với mã: "${code}"`,
      );
    }

    // Map trạng thái thân thiện với người dùng
    const statusLabels: Record<RfqStatus, { title: string; step: number; description: string }> = {
      [RfqStatus.PENDING]: {
        title: 'Mới tiếp nhận',
        step: 1,
        description: 'Hệ thống đã ghi nhận yêu cầu. Kỹ sư tư vấn sẽ liên hệ trong vòng 30 phút.',
      },
      [RfqStatus.CONTACTED]: {
        title: 'Đã liên hệ',
        step: 2,
        description: 'Kỹ sư đã trao đổi sơ bộ với khách hàng về mặt bằng và công suất dự kiến.',
      },
      [RfqStatus.TECHNICAL_CONSULTING]: {
        title: 'Khảo sát kỹ thuật',
        step: 3,
        description: 'Đội ngũ kỹ thuật đang kiểm tra thông số điện (1 pha/3 pha) và vị trí lắp đặt.',
      },
      [RfqStatus.QUOTE_SENT]: {
        title: 'Đã gửi báo giá',
        step: 4,
        description: 'Bảng báo giá chi tiết và phương án lắp đặt đã được gửi tới email/zalo.',
      },
      [RfqStatus.NEGOTIATING]: {
        title: 'Thương thảo hợp đồng',
        step: 5,
        description: 'Hai bên đang thống nhất điều khoản giao nhận và thanh toán cọc theo đợt.',
      },
      [RfqStatus.ACCEPTED]: {
        title: 'Đã chốt báo giá',
        step: 6,
        description: 'Khách hàng đã đồng ý với phương án thiết bị và tiến hành ký hợp đồng.',
      },
      [RfqStatus.REJECTED]: {
        title: 'Hủy/Từ chối',
        step: 0,
        description: 'Yêu cầu báo giá đã được hủy theo đề nghị của khách hàng.',
      },
      [RfqStatus.CONVERTED_TO_ORDER]: {
        title: 'Đã chuyển thành đơn hàng',
        step: 7,
        description: 'Yêu cầu báo giá đã được chuyển sang hợp đồng sản xuất và xuất xưởng.',
      },
    };

    return {
      ...rfq,
      statusDetail: statusLabels[rfq.status],
    };
  }

  /**
   * Cập nhật trạng thái xử lý RFQ nội bộ
   */
  async updateQuotationStatus(id: string, dto: UpdateQuotationStatusDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy yêu cầu báo giá có ID: "${id}"`);
    }

    return this.repository.update(id, {
      status: dto.status,
      internalTechnicalNotes: dto.internalTechnicalNotes,
      estimatedTotal:
        dto.estimatedTotal !== undefined
          ? new Prisma.Decimal(dto.estimatedTotal)
          : undefined,
      assignedStaff: dto.assignedStaffId
        ? { connect: { id: dto.assignedStaffId } }
        : undefined,
    });
  }

  /**
   * Danh sách RFQs cho trang quản trị nội bộ
   */
  async getQuotationsList(params: {
    status?: RfqStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.repository.findMany({
      status: params.status,
      search: params.search,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
