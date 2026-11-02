import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class UpdateBrandDto {
  @IsString({ message: 'Tên thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsOptional()
  slug?: string;

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
