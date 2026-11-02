import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString({ message: 'Tên thiết bị phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsOptional()
  slug?: string;

  @IsString({ message: 'Mã model máy phải là chuỗi ký tự' })
  @IsOptional()
  modelCode?: string;

  @IsString({ message: 'Tóm tắt kỹ thuật phải là chuỗi ký tự' })
  @IsOptional()
  summary?: string;

  @IsString({ message: 'Mô tả chi tiết phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'brandId phải là chuỗi UUID' })
  @IsOptional()
  brandId?: string;

  @IsString({ message: 'categoryId phải là chuỗi UUID hoặc slug' })
  @IsOptional()
  categoryId?: string;

  @IsString({ message: 'category phải là chuỗi ID hoặc slug' })
  @IsOptional()
  category?: string;

  @IsString({ message: 'categorySlug phải là chuỗi slug' })
  @IsOptional()
  categorySlug?: string;

  @IsBoolean({ message: 'isQuoteOnly phải là boolean' })
  @IsOptional()
  isQuoteOnly?: boolean;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tham chiếu phải là số' })
  @Min(0, { message: 'Giá tham chiếu không được âm' })
  @IsOptional()
  basePrice?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá bán phải là số' })
  @Min(0, { message: 'Giá bán không được âm' })
  @IsOptional()
  price?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối thiểu phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá tối đa phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  @IsOptional()
  maxPrice?: number;

  @IsString({ message: 'specSheetPdfUrl phải là đường dẫn URL' })
  @IsOptional()
  specSheetPdfUrl?: string;

  @IsString({ message: 'manualPdfUrl phải là đường dẫn URL' })
  @IsOptional()
  manualPdfUrl?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsString({ message: 'thumbnail phải là đường dẫn ảnh' })
  thumbnail?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsString({ message: 'avatar phải là đường dẫn ảnh' })
  avatar?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsString({ message: 'imageUrl phải là đường dẫn ảnh' })
  imageUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsString({ message: 'thumbnailUrl phải là đường dẫn ảnh' })
  thumbnailUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsString({ message: 'primaryImage phải là đường dẫn ảnh' })
  primaryImage?: string | null;

  @IsArray({ message: 'images phải là mảng chuỗi ảnh' })
  @IsOptional()
  images?: string[];

  @IsString({ message: 'videoUrl phải là đường dẫn URL video' })
  @IsOptional()
  videoUrl?: string;

  @Type(() => Number)
  @IsInt({ message: 'Thời gian bảo hành phải là số tháng' })
  @Min(0, { message: 'Thời gian bảo hành không được âm' })
  @IsOptional()
  warrantyMonths?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Giá máy mới tham chiếu phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  @IsOptional()
  originalPrice?: number;

  @IsString({ message: 'condition phải là chuỗi' })
  @IsOptional()
  condition?: any;

  @IsString({ message: 'availability phải là chuỗi' })
  @IsOptional()
  availability?: any;

  @IsString({ message: 'refurbishDetails phải là chuỗi' })
  @IsOptional()
  refurbishDetails?: string;

  @IsString({ message: 'testVideoUrl phải là chuỗi' })
  @IsOptional()
  testVideoUrl?: string;

  @IsOptional()
  inspectionChecklist?: any;

  @IsOptional()
  checklist?: any;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng không được âm' })
  @IsOptional()
  stock?: number;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng đã bán phải là số nguyên' })
  @Min(0, { message: 'Số lượng đã bán không được âm' })
  @IsOptional()
  soldCount?: number;

  @Type(() => Number)
  @IsInt({ message: 'Năm sản xuất phải là số nguyên' })
  @IsOptional()
  yearOfManufacture?: number;

  @IsOptional()
  manufactureYear?: any;

  @IsString({ message: 'status phải là chuỗi (available, out_of_stock, reserved)' })
  @IsOptional()
  status?: string;

  @IsString({ message: 'Tên thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  brandName?: string;

  @IsBoolean({ message: 'isFeatured phải là boolean' })
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean({ message: 'isActive phải là boolean' })
  @IsOptional()
  isActive?: boolean;
}
