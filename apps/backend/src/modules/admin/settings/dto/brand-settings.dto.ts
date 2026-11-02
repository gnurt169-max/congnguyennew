import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandSettingsDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  brandTagline?: string;

  @IsOptional()
  @IsString()
  brandLogoText?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;
}

