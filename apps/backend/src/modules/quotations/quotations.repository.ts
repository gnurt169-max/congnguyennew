import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RfqStatus } from '@prisma/client';

@Injectable()
export class QuotationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã báo giá tự động theo format chuẩn công nghiệp: BG-YYYYMM-XXXX (Ví dụ: BG-202610-0001)
   */
  async generateQuotationCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `BG-${year}${month}-`;

    // Tìm mã báo giá mới nhất trong tháng hiện tại
    const latestRfq = await this.prisma.quotationRequest.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let sequence = 1;
    if (latestRfq && latestRfq.code) {
      const parts = latestRfq.code.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    const seqString = String(sequence).padStart(4, '0');
    return `${prefix}${seqString}`;
  }

  async findByCode(code: string) {
    return this.prisma.quotationRequest.findUnique({
      where: { code },
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
                specSheetPdfUrl: true,
                brand: {
                  select: { name: true, originCountry: true },
                },
                category: {
                  select: { name: true },
                },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                powerType: true,
                powerKw: true,
                dimensions: true,
                price: true,
              },
            },
          },
        },
        assignedStaff: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.QuotationRequestCreateInput) {
    return this.prisma.quotationRequest.create({
      data,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                modelCode: true,
                thumbnail: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                powerType: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.QuotationRequestUpdateInput) {
    return this.prisma.quotationRequest.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        assignedStaff: true,
      },
    });
  }

  async findMany(params: {
    status?: Prisma.EnumRfqStatusFilter | RfqStatus;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.QuotationRequestWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const q = params.search.trim();
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
                select: { name: true, modelCode: true },
              },
            },
          },
          assignedStaff: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.quotationRequest.count({ where }),
    ]);

    return { items, total };
  }
}
