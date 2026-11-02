import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateContactSettingsDto {
  @IsOptional()
  @IsString()
  hotline?: string;

  @IsOptional()
  @IsString()
  zaloPhone?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  emailContact?: string;

  @IsOptional()
  @IsString()
  showroomAddress?: string;
}
