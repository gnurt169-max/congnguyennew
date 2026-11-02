import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RfqStatus } from '@industrial-bakery/shared-types';

export class AdminQuoteItemDto {
  @IsString({ message: 'QuotationItem ID phải là chuỗi UUID' })
  @IsNotEmpty({ message: 'Item ID không được để trống' })
  id: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn giá chào thầu phải là số' })
  @Min(0, { message: 'Đơn giá không được âm' })
  offeredUnitPrice: number;

  @IsString({ message: 'Ghi chú kỹ thuật phải là chuỗi ký tự' })
  @IsOptional()
  technicalNotes?: string;
}

export class AdminQuoteRfqDto {
  @IsArray({ message: 'Danh sách giá chào thầu phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => AdminQuoteItemDto)
  @IsNotEmpty({ message: 'Cần cung cấp đơn giá chào thầu' })
  items: AdminQuoteItemDto[];

  @IsString({ message: 'Ghi chú kỹ thuật nội bộ phải là chuỗi ký tự' })
  @IsOptional()
  internalTechnicalNotes?: string;

  @IsEnum(RfqStatus, {
    message: 'Trạng thái RFQ không hợp lệ',
  })
  @IsOptional()
  status?: RfqStatus = RfqStatus.QUOTE_SENT;

  @IsString({ message: 'assignedStaffId phải là chuỗi UUID' })
  @IsOptional()
  assignedStaffId?: string;
}
