import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateAdminMenuLabelDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;

  @IsOptional()
  @IsString()
  products_module?: string;
}

