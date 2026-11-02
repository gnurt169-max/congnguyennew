import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsString()
  @IsOptional()
  bankId?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsBoolean()
  @IsOptional()
  isBankEnabled?: boolean;

  @IsString()
  @IsOptional()
  momoPhone?: string;

  // Optional: không bắt buộc nhập tên người nhận MoMo
  @IsString()
  @IsOptional()
  momoName?: string;

  @IsString()
  @IsOptional()
  momoQrUrl?: string;

  @IsBoolean()
  @IsOptional()
  isMomoEnabled?: boolean;
}
