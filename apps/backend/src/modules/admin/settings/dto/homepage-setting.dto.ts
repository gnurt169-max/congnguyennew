import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StatItemDto {
  @IsString()
  value: string;

  @IsString()
  label: string;
}

export class UpdateHomepageConfigDto {
  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsString()
  headingText?: string;

  @IsOptional()
  @IsString()
  headingHighlight?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  primaryCtaText?: string;

  @IsOptional()
  @IsString()
  primaryCtaLink?: string;

  @IsOptional()
  @IsString()
  secondaryCtaText?: string;

  @IsOptional()
  @IsString()
  secondaryCtaLink?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatItemDto)
  stats?: StatItemDto[];

  @IsOptional()
  @IsString()
  featuredImageUrl?: string;

  @IsOptional()
  @IsString()
  featuredBadgeTag?: string;

  @IsOptional()
  @IsString()
  featuredCategoryTag?: string;

  @IsOptional()
  @IsString()
  featuredTitle?: string;

  @IsOptional()
  @IsString()
  featuredStatusTag?: string;

  @IsOptional()
  @IsBoolean()
  founderShow?: boolean;

  @IsOptional()
  @IsString()
  founderName?: string;

  @IsOptional()
  @IsString()
  founderTitle?: string;

  @IsOptional()
  @IsString()
  founderCommitment?: string;

  @IsOptional()
  @IsString()
  founderAvatarUrl?: string;

  @IsOptional()
  @IsString()
  founderLine?: string;
}

