import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wines')
export class Wine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  wineryName: string;

  @Column()
  wineName: string;

  @Column()
  varietal: string;

  @Column({ nullable: true })
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  estimatedPrice: number;

  @Column()
  wineryCity: string;

  @Column()
  wineryState: string;

  @Column()
  wineryAddress: string;

  @Column()
  wineryUrl: string;

  @Column()
  imageUrl: string;

  @Column()
  thumbnailUrl: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
