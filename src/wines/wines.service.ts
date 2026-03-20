import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Wine } from './entities/wine.entity';
import { CreateWineDto } from './dto/create-wine.dto';
import { UpdateWineDto } from './dto/update-wine.dto';

@Injectable()
export class WinesService {
  constructor(
    @InjectRepository(Wine)
    private readonly wineRepository: Repository<Wine>,
  ) {}

  async create(createWineDto: CreateWineDto): Promise<Wine> {
    const wine = this.wineRepository.create(createWineDto);
    return this.wineRepository.save(wine);
  }

  async findAll(): Promise<Wine[]> {
    return this.wineRepository.find({
      order: { wineryName: 'ASC', wineName: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Wine> {
    const wine = await this.wineRepository.findOne({ where: { id } });
    if (!wine) {
      throw new NotFoundException(`Wine with ID ${id} not found`);
    }
    return wine;
  }

  async findByIds(ids: number[]): Promise<Wine[]> {
    return this.wineRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByVarietal(varietal: string): Promise<Wine[]> {
    return this.wineRepository.find({
      where: { varietal },
      order: { wineryName: 'ASC' },
    });
  }

  async update(id: number, updateWineDto: UpdateWineDto): Promise<Wine> {
    const wine = await this.findOne(id);
    Object.assign(wine, updateWineDto);
    return this.wineRepository.save(wine);
  }

  async remove(id: number): Promise<void> {
    const wine = await this.findOne(id);
    await this.wineRepository.remove(wine);
  }

  async getAvailableVarietals(): Promise<string[]> {
    const result = await this.wineRepository
      .createQueryBuilder('wine')
      .select('DISTINCT wine.varietal', 'varietal')
      .orderBy('varietal', 'ASC')
      .getRawMany();
    return result.map((r) => r.varietal);
  }
}
