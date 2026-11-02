import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateProductCategoryDto {
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsString({ message: 'ID, slug hoặc tên danh mục phải là chuỗi ký tự' })
  categoryId: string;

  @IsOptional()
  @IsString()
  categoryName?: string;
}
