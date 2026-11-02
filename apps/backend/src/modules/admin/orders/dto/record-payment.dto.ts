import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentMilestoneType, PaymentStatus } from '@industrial-bakery/shared-types';

export class RecordPaymentDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền thanh toán phải là số' })
  @Min(1000, { message: 'Số tiền thanh toán tối thiểu là 1.000 VNĐ' })
  amount: number;

  @IsEnum(PaymentMilestoneType, {
    message: 'Giai đoạn thanh toán không hợp lệ (DEPOSIT_STAGE_1, PRE_DELIVERY_STAGE_2, HANDOVER_FINAL_STAGE_3)',
  })
  @IsNotEmpty({ message: 'Vui lòng chọn đợt thanh toán' })
  milestoneType: PaymentMilestoneType;

  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.BANK_TRANSFER_DOMESTIC;

  @IsEnum(PaymentStatus, {
    message: 'Trạng thái thanh toán không hợp lệ',
  })
  @IsOptional()
  status?: PaymentStatus = PaymentStatus.CONFIRMED;

  @IsString({ message: 'Mã giao dịch / UNC phải là chuỗi ký tự' })
  @IsOptional()
  transactionRef?: string;

  @IsString({ message: 'Ghi chú thanh toán phải là chuỗi ký tự' })
  @IsOptional()
  notes?: string;
}
