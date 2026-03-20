import { IsString, IsNumber, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateWineDto {
  @IsString()
  wineryName: string;

  @IsString()
  wineName: string;

  @IsString()
  varietal: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsNumber()
  @Min(0)
  estimatedPrice: number;

  @IsString()
  wineryCity: string;

  @IsString()
  wineryState: string;

  @IsString()
  wineryAddress: string;

  @IsUrl()
  wineryUrl: string;

  @IsUrl()
  imageUrl: string;

  @IsUrl()
  thumbnailUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}
