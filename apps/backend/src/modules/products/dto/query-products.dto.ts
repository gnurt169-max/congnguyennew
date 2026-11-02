import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProductSortOption {
  CREATED_AT_DESC = 'createdAt_desc',
  CREATED_AT_ASC = 'createdAt_asc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
}

export class QueryProductsDto {
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang tối thiểu là 1' })
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng sản phẩm mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(50, { message: 'Số lượng tối đa mỗi trang là 50' })
  @IsOptional()
  limit?: number = 12;

  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  q?: string;

  @IsString({ message: 'Danh mục phải là chuỗi ký tự (ID hoặc slug)' })
  @IsOptional()
  category?: string;

  @IsString({ message: 'Slug danh mục phải là chuỗi ký tự' })
  @IsOptional()
  categorySlug?: string;

  @IsString({ message: 'ID danh mục phải là chuỗi ký tự' })
  @IsOptional()
  categoryId?: string;

  @IsString({ message: 'Độ mới/Tình trạng máy phải là chuỗi ký tự' })
  @IsOptional()
  condition?: string;

  @IsString({ message: 'Thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  brand?: string;

  @IsString({ message: 'Slug thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  brandSlug?: string;

  @IsString({ message: 'ID thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  brandId?: string;

  @IsString({ message: 'Nguồn điện phải là chuỗi ký tự' })
  @IsOptional()
  powerSource?: string;

  @IsString({ message: 'Nguồn điện phải là chuỗi ký tự' })
  @IsOptional()
  power?: string;

  @IsString({ message: 'Loại nguồn điện phải là chuỗi ký tự' })
  @IsOptional()
  powerType?: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isQuoteOnly phải là giá trị boolean' })
  @IsOptional()
  isQuoteOnly?: boolean;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối thiểu phải là số' })
  @Min(0, { message: 'Giá tối thiểu không được âm' })
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối đa phải là số' })
  @Min(0, { message: 'Giá tối đa không được âm' })
  @IsOptional()
  maxPrice?: number;

  @IsString()
  @IsOptional()
  sort?: string = ProductSortOption.CREATED_AT_DESC;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString({ message: 'Tình trạng tồn kho (stockStatus) phải là chuỗi (all, in_stock, sold_out)' })
  @IsOptional()
  stockStatus?: string; // 'all' | 'in_stock' | 'sold_out'

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'inStock phải là giá trị boolean' })
  @IsOptional()
  inStock?: boolean;
}

