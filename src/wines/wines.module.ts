import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinesService } from './wines.service';
import { WinesController } from './wines.controller';
import { Wine } from './entities/wine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wine])],
  controllers: [WinesController],
  providers: [WinesService],
  exports: [WinesService],
})
export class WinesModule {}
