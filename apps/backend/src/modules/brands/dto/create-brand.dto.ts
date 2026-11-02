import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateBrandDto {
  @IsString({ message: 'Tên thương hiệu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên thương hiệu không được để trống' })
  name: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug: string;

  @IsString({ message: 'URL logo phải là chuỗi ký tự' })
  @IsOptional()
  logoUrl?: string;

  @IsString({ message: 'Quốc gia xuất xứ phải là chuỗi ký tự' })
  @IsOptional()
  originCountry?: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsUrl({}, { message: 'Website phải là một URL hợp lệ' })
  @IsOptional()
  website?: string;

  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  @IsOptional()
  isActive?: boolean;
}
