import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { VarietalMappingsService } from './varietal-mappings.service';
import { CreateVarietalMappingDto } from './dto/create-varietal-mapping.dto';

@Controller('varietal-mappings')
export class VarietalMappingsController {
  constructor(private readonly mappingsService: VarietalMappingsService) {}

  @Post()
  create(@Body() dto: CreateVarietalMappingDto) {
    return this.mappingsService.create(dto);
  }

  @Get()
  findAll() {
    return this.mappingsService.findAll();
  }

  @Get('varietals')
  getVarietals() {
    return this.mappingsService.getAvailableVarietals();
  }

  @Get('recommendations')
  getRecommendations(
    @Query('varietals') varietals: string,
    @Query('limit') limit?: string,
  ) {
    const varietalList = varietals.split(',').map((v) => v.trim());
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.mappingsService.getRecommendations(varietalList, limitNum);
  }

  @Get(':varietal')
  findByVarietal(@Param('varietal') varietal: string) {
    return this.mappingsService.getWinesForVarietal(varietal);
  }

  @Delete(':varietal/:wineId')
  remove(
    @Param('varietal') varietal: string,
    @Param('wineId', ParseIntPipe) wineId: number,
  ) {
    return this.mappingsService.remove(varietal, wineId);
  }
}
