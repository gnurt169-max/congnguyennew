import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RfqStatus } from '@industrial-bakery/shared-types';

export class UpdateQuotationStatusDto {
  @IsEnum(RfqStatus, {
    message: 'Trạng thái RFQ không hợp lệ (PENDING, CONTACTED, TECHNICAL_CONSULTING, QUOTE_SENT, NEGOTIATING, ACCEPTED, REJECTED, CONVERTED_TO_ORDER)',
  })
  status: RfqStatus;

  @IsString({ message: 'Ghi chú kỹ thuật nội bộ phải là chuỗi ký tự' })
  @IsOptional()
  internalTechnicalNotes?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng giá trị ước tính phải là số' })
  @Min(0, { message: 'Tổng giá trị ước tính không được âm' })
  @IsOptional()
  estimatedTotal?: number;

  @IsString({ message: 'assignedStaffId phải là chuỗi UUID' })
  @IsOptional()
  assignedStaffId?: string;
}
