import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { RfqStatus } from '@industrial-bakery/shared-types';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  /**
   * API POST /api/v1/quotations
   * Tiếp nhận yêu cầu báo giá kỹ thuật B2B (RFQ) từ khách hàng/xưởng bánh
   * Tự động sinh mã duy nhất: BG-YYYYMM-XXXX
   */
  @Post()
  async createQuotation(@Body() dto: CreateQuotationDto) {
    return this.quotationsService.createQuotation(dto);
  }

  /**
   * API GET /api/v1/quotations/:code
   * Tra cứu thông tin và tiến độ xử lý báo giá theo mã (Ví dụ: BG-202610-0001)
   */
  @Get(':code')
  async getQuotationByCode(@Param('code') code: string) {
    return this.quotationsService.getQuotationByCode(code);
  }

  /**
   * API GET /api/v1/quotations
   * Danh sách các yêu cầu báo giá cho bộ phận kỹ sư kinh doanh
   */
  @Get()
  async getQuotations(
    @Query('status') status?: RfqStatus,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.quotationsService.getQuotationsList({
      status,
      search,
      page,
      limit,
    });
  }

  /**
   * API PUT /api/v1/quotations/:id/status
   * Cập nhật trạng thái xử lý RFQ (Khảo sát kỹ thuật, Đã gửi báo giá, Chốt đơn...)
   */
  @Put(':id/status')
  async updateQuotationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
  ) {
    return this.quotationsService.updateQuotationStatus(id, dto);
  }
}
