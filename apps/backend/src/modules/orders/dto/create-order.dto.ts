import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@industrial-bakery/shared-types';

export class CreateOrderItemDto {
  @IsString({ message: 'productId phải là chuỗi UUID' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: string;

  @IsString({ message: 'variantId phải là chuỗi UUID' })
  @IsOptional()
  variantId?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number = 1;
}

export class CreateOrderDto {
  @IsString({ message: 'Họ tên người nhận hàng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên người nhận không được để trống' })
  customerName: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)',
  })
  customerPhone: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  customerEmail?: string;

  @IsString({ message: 'Tên xưởng / công ty phải là chuỗi ký tự' })
  @IsOptional()
  companyName?: string;

  @IsString({ message: 'Mã số thuế phải là chuỗi ký tự' })
  @IsOptional()
  taxCode?: string;

  @IsBoolean({ message: 'isCompanyInvoice phải là boolean' })
  @IsOptional()
  isCompanyInvoice?: boolean;

  @IsString({ message: 'Địa chỉ nhận hàng & lắp đặt xưởng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Địa chỉ nhận hàng & lắp đặt không được để trống' })
  shippingAddress: string;

  @IsString({ message: 'Địa chỉ xuất hóa đơn phải là chuỗi ký tự' })
  @IsOptional()
  billingAddress?: string;

  @Type(() => Number)
  @IsInt({ message: 'Tỷ lệ đặt cọc phải là số (30, 50 hoặc 100)' })
  @IsOptional()
  depositPercent?: number = 30; // Mặc định cọc đợt 1 là 30%

  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ (BANK_TRANSFER_DOMESTIC, CORPORATE_LETTER_OF_CREDIT, CASH, ONLINE_VNPAY, ONLINE_MOMO)',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.BANK_TRANSFER_DOMESTIC;

  @IsString({ message: 'Ghi chú đơn hàng / yêu cầu lắp đặt phải là chuỗi ký tự' })
  @IsOptional()
  notes?: string;

  @IsString({ message: 'quotationRequestId phải là chuỗi UUID' })
  @IsOptional()
  quotationRequestId?: string;

  @IsArray({ message: 'Danh sách sản phẩm (items) phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty({ message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  items: CreateOrderItemDto[];
}
