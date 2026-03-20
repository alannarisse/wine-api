import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { WinesService } from './wines.service';
import { CreateWineDto } from './dto/create-wine.dto';
import { UpdateWineDto } from './dto/update-wine.dto';

@Controller('wines')
export class WinesController {
  constructor(private readonly winesService: WinesService) {}

  @Post()
  create(@Body() createWineDto: CreateWineDto) {
    return this.winesService.create(createWineDto);
  }

  @Get()
  findAll() {
    return this.winesService.findAll();
  }

  @Get('varietals')
  getVarietals() {
    return this.winesService.getAvailableVarietals();
  }

  @Get('by-varietal/:varietal')
  findByVarietal(@Param('varietal') varietal: string) {
    return this.winesService.findByVarietal(varietal);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.winesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWineDto: UpdateWineDto,
  ) {
    return this.winesService.update(id, updateWineDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.winesService.remove(id);
  }
}
