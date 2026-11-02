import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateGeminiSettingsDto {
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isAiEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  aiModelName?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  widgetRole?: string;
}

// Alias class for flexibility
export class UpdateAiConfigDto extends UpdateGeminiSettingsDto {}

export class TestGeminiKeyDto {
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  aiModelName?: string;
}

export class GenerateTextDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  systemInstruction?: string;
}

export class GenerateProductDescriptionDto {
  @IsString()
  productName: string;

  @IsOptional()
  specs?: Record<string, any>;
}

export class ChatMessageItemDto {
  role: 'user' | 'model';
  text: string;
}

export class AiChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  history?: ChatMessageItemDto[];
}
