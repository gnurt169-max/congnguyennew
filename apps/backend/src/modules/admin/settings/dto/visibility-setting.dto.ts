import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVisibilityDto {
  @IsBoolean({ message: 'showBadge phải là kiểu boolean (true/false)' })
  @IsOptional()
  showBadge?: boolean;

  @IsBoolean({ message: 'showHeroStats phải là kiểu boolean (true/false)' })
  @IsOptional()
  showHeroStats?: boolean;

  @IsBoolean({ message: 'showHeroFeaturedCard phải là kiểu boolean (true/false)' })
  @IsOptional()
  showHeroFeaturedCard?: boolean;

  @IsBoolean({ message: 'showSecondaryCTA phải là kiểu boolean (true/false)' })
  @IsOptional()
  showSecondaryCTA?: boolean;

  @IsBoolean({ message: 'showFloatingContact phải là kiểu boolean (true/false)' })
  @IsOptional()
  showFloatingContact?: boolean;

  @IsBoolean({ message: 'showWorkshopLocation phải là kiểu boolean (true/false)' })
  @IsOptional()
  showWorkshopLocation?: boolean;

  @IsBoolean({ message: 'showHotProductsSection phải là kiểu boolean (true/false)' })
  @IsOptional()
  showHotProductsSection?: boolean;

  @IsBoolean({ message: 'showTestimonials phải là kiểu boolean (true/false)' })
  @IsOptional()
  showTestimonials?: boolean;
}
