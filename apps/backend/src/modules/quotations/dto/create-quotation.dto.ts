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
  IsNumber,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PowerType } from '@industrial-bakery/shared-types';

export class CreateQuotationItemDto {
  @IsString({ message: 'productId phải là chuỗi UUID' })
  @IsOptional()
  productId?: string;

  @IsString({ message: 'variantId phải là chuỗi UUID' })
  @IsOptional()
  variantId?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng máy yêu cầu phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @IsOptional()
  quantity?: number = 1;

  @Type(() => Number)
  @IsNumber({}, { message: 'Mức giá kỳ vọng phải là số' })
  @Min(0, { message: 'Mức giá không được âm' })
  @IsOptional()
  targetUnitPrice?: number;

  @IsString({ message: 'Yêu cầu kỹ thuật đặc biệt phải là chuỗi ký tự' })
  @IsOptional()
  specialRequirements?: string;
}

export class CreateQuotationDto {
  @IsString({ message: 'Họ tên người liên hệ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên người liên hệ không được để trống' })
  contactName: string;

  @IsString({ message: 'Tên xưởng/doanh nghiệp phải là chuỗi ký tự' })
  @IsOptional()
  companyName?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)',
  })
  phone: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Địa chỉ lắp đặt/khảo sát xưởng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Địa chỉ lắp đặt/khảo sát không được để trống' })
  installationAddress: string;

  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi ký tự' })
  @IsOptional()
  province?: string;

  @IsString({ message: 'Quận/Huyện phải là chuỗi ký tự' })
  @IsOptional()
  district?: string;

  @IsEnum(PowerType, {
    message: 'Nguồn điện không hợp lệ (SINGLE_PHASE_220V, THREE_PHASE_380V, HYBRID_220_380V, UNPOWERED_MANUAL)',
  })
  powerSupplyType: PowerType;

  @IsString({ message: 'Năng suất dự kiến phải là chuỗi ký tự' })
  @IsOptional()
  dailyCapacityRequirement?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  customerNotes?: string;

  @IsArray({ message: 'Danh sách thiết bị yêu cầu (items) phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  @IsNotEmpty({ message: 'Phải chọn ít nhất 1 thiết bị để yêu cầu báo giá' })
  items: CreateQuotationItemDto[];
}
