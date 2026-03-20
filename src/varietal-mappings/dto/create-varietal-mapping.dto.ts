import { IsString, IsNumber } from 'class-validator';

export class CreateVarietalMappingDto {
  @IsString()
  varietal: string;

  @IsNumber()
  wineId: number;
}
