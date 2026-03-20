import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VarietalMappingsService } from './varietal-mappings.service';
import { VarietalMappingsController } from './varietal-mappings.controller';
import { VarietalMapping } from './entities/varietal-mapping.entity';
import { WinesModule } from '../wines/wines.module';

@Module({
  imports: [TypeOrmModule.forFeature([VarietalMapping]), WinesModule],
  controllers: [VarietalMappingsController],
  providers: [VarietalMappingsService],
  exports: [VarietalMappingsService],
})
export class VarietalMappingsModule {}
