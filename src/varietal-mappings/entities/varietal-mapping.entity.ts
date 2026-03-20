import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wine } from '../../wines/entities/wine.entity';

@Entity('varietal_mappings')
export class VarietalMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  varietal: string;

  @Column()
  wineId: number;

  @ManyToOne(() => Wine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wineId' })
  wine: Wine;

  @CreateDateColumn()
  createdAt: Date;
}
