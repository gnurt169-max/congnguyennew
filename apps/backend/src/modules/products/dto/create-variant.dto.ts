import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PowerType } from '@industrial-bakery/shared-types';

export class CreateProductVariantDto {
  @IsString({ message: 'SKU phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã SKU không được để trống' })
  sku: string;

  @IsString({ message: 'Tên biến thể phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên biến thể không được để trống' })
  name: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không được âm' })
  @IsOptional()
  price?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá gốc phải là số' })
  @Min(0, { message: 'Giá gốc không được âm' })
  @IsOptional()
  originalPrice?: number;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  @IsOptional()
  stockQuantity?: number = 0;

  @IsBoolean({ message: 'isQuoteOnly phải là boolean' })
  @IsOptional()
  isQuoteOnly?: boolean;

  @IsEnum(PowerType, {
    message: 'Nguồn điện không hợp lệ (SINGLE_PHASE_220V, THREE_PHASE_380V, HYBRID_220_380V, UNPOWERED_MANUAL)',
  })
  powerType: PowerType;

  @Type(() => Number)
  @IsNumber({}, { message: 'Công suất kW phải là số' })
  @Min(0, { message: 'Công suất kW không được âm' })
  @IsOptional()
  powerKw?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Trọng lượng máy kg phải là số' })
  @Min(0, { message: 'Trọng lượng không được âm' })
  @IsOptional()
  weightKg?: number;

  @IsString({ message: 'Kích thước D x R x C phải là chuỗi ký tự' })
  @IsOptional()
  dimensions?: string;

  @IsString({ message: 'Mã vạch barcode phải là chuỗi ký tự' })
  @IsOptional()
  barcode?: string;

  @IsArray({ message: 'attributeValueIds phải là mảng id thông số' })
  @IsOptional()
  attributeValueIds?: string[];

  @IsBoolean({ message: 'isActive phải là boolean' })
  @IsOptional()
  isActive?: boolean;
}
