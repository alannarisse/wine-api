import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VarietalMapping } from './entities/varietal-mapping.entity';
import { CreateVarietalMappingDto } from './dto/create-varietal-mapping.dto';
import { WinesService } from '../wines/wines.service';
import { Wine } from '../wines/entities/wine.entity';

@Injectable()
export class VarietalMappingsService {
  constructor(
    @InjectRepository(VarietalMapping)
    private readonly mappingRepository: Repository<VarietalMapping>,
    private readonly winesService: WinesService,
  ) {}

  async create(dto: CreateVarietalMappingDto): Promise<VarietalMapping> {
    // Verify wine exists
    await this.winesService.findOne(dto.wineId);

    // Check if mapping already exists
    const existing = await this.mappingRepository.findOne({
      where: { varietal: dto.varietal, wineId: dto.wineId },
    });
    if (existing) {
      return existing;
    }

    const mapping = this.mappingRepository.create(dto);
    return this.mappingRepository.save(mapping);
  }

  async findAll(): Promise<Record<string, number[]>> {
    const mappings = await this.mappingRepository.find({
      order: { varietal: 'ASC' },
    });

    // Group by varietal
    const result: Record<string, number[]> = {};
    for (const mapping of mappings) {
      if (!result[mapping.varietal]) {
        result[mapping.varietal] = [];
      }
      result[mapping.varietal].push(mapping.wineId);
    }
    return result;
  }

  async findByVarietal(varietal: string): Promise<VarietalMapping[]> {
    return this.mappingRepository.find({
      where: { varietal },
      relations: ['wine'],
    });
  }

  async getWinesForVarietal(varietal: string) {
    const mappings = await this.findByVarietal(varietal);
    return mappings.map((m) => m.wine);
  }

  async getRecommendations(varietals: string[], limit: number = 10): Promise<Wine[]> {
    const wineIds = new Set<number>();
    const wines: Wine[] = [];

    for (const varietal of varietals) {
      if (wines.length >= limit) break;

      const mappings = await this.mappingRepository.find({
        where: { varietal },
        relations: ['wine'],
      });

      for (const mapping of mappings) {
        if (!wineIds.has(mapping.wineId) && wines.length < limit) {
          wineIds.add(mapping.wineId);
          wines.push(mapping.wine);
        }
      }
    }

    return wines;
  }

  async remove(varietal: string, wineId: number): Promise<void> {
    const mapping = await this.mappingRepository.findOne({
      where: { varietal, wineId },
    });
    if (!mapping) {
      throw new NotFoundException(
        `Mapping for varietal "${varietal}" and wine ID ${wineId} not found`,
      );
    }
    await this.mappingRepository.remove(mapping);
  }

  async getAvailableVarietals(): Promise<string[]> {
    const result = await this.mappingRepository
      .createQueryBuilder('mapping')
      .select('DISTINCT mapping.varietal', 'varietal')
      .orderBy('varietal', 'ASC')
      .getRawMany();
    return result.map((r) => r.varietal);
  }
}
