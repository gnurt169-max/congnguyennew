import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsOptional()
  slug?: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'URL ảnh phải là chuỗi ký tự' })
  @IsOptional()
  imageUrl?: string;

  @IsString({ message: 'Parent ID phải là chuỗi UUID' })
  @IsOptional()
  parentId?: string;

  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(0, { message: 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0' })
  @IsOptional()
  sortOrder?: number;

  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  @IsOptional()
  isActive?: boolean;
}
