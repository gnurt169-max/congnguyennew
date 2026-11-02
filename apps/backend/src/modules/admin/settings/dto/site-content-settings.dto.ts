import { IsString, IsOptional, IsArray } from 'class-validator';

export class FeaturedLinkItemDto {
  label: string;
  url: string;
}

export class UpdateSiteContentSettingsDto {
  @IsOptional()
  @IsString()
  bannerTitle?: string;

  @IsOptional()
  @IsString()
  bannerSubtitle?: string;

  @IsOptional()
  @IsString()
  bannerButtonText?: string;

  @IsOptional()
  @IsString()
  bannerButtonLink?: string;

  @IsOptional()
  @IsString()
  bannerHotline?: string;

  @IsOptional()
  @IsString()
  footerCompanyName?: string;

  @IsOptional()
  @IsString()
  footerSlogan?: string;

  @IsOptional()
  @IsString()
  footerDescription?: string;

  @IsOptional()
  @IsString()
  footerCopyright?: string;

  @IsOptional()
  @IsArray()
  featuredLinks?: FeaturedLinkItemDto[];
}
