import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NavigationItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  href?: string;

  @IsString()
  @IsOptional()
  badge?: string | null;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isOpenNewTab?: boolean;
}

export class UpdateNavigationSettingsDto {
  @IsArray({ message: 'Danh sách menu phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => NavigationItemDto)
  items: NavigationItemDto[];
}

