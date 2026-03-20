import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinesModule } from './wines/wines.module';
import { VarietalMappingsModule } from './varietal-mappings/varietal-mappings.module';
import { Wine } from './wines/entities/wine.entity';
import { VarietalMapping } from './varietal-mappings/entities/varietal-mapping.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [Wine, VarietalMapping],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        ssl: configService.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    WinesModule,
    VarietalMappingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
