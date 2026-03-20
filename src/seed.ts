import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinesService } from './wines/wines.service';
import { VarietalMappingsService } from './varietal-mappings/varietal-mappings.service';

// Initial wine data - matches the Angular frontend data
const WINES_DATA = [
  {
    wineryName: 'Willamette Valley Vineyards',
    wineName: 'Whole Cluster Pinot Noir',
    varietal: 'Pinot Noir',
    year: 2021,
    estimatedPrice: 45,
    wineryCity: 'Turner',
    wineryState: 'OR',
    wineryAddress: '8800 Enchanted Way SE',
    wineryUrl: 'https://www.wvv.com',
    imageUrl: 'https://images.vivino.com/thumbs/ApnFiWsLoRkdpx6bWwMw6Q_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/ApnFiWsLoRkdpx6bWwMw6Q_375x500.jpg',
    description: 'Elegant and earthy with notes of cherry, forest floor, and spice.',
  },
  {
    wineryName: 'Domaine Serene',
    wineName: 'Evenstad Reserve Pinot Noir',
    varietal: 'Pinot Noir',
    year: 2019,
    estimatedPrice: 85,
    wineryCity: 'Dayton',
    wineryState: 'OR',
    wineryAddress: '6555 NE Hilltop Lane',
    wineryUrl: 'https://www.domaineserene.com',
    imageUrl: 'https://images.vivino.com/thumbs/L5Qk0HQP2D5vARsFI9pFGg_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/L5Qk0HQP2D5vARsFI9pFGg_375x500.jpg',
    description: 'Rich and complex with layers of dark fruit, vanilla, and silky tannins.',
  },
  {
    wineryName: 'Rombauer Vineyards',
    wineName: 'Chardonnay',
    varietal: 'Chardonnay',
    year: 2022,
    estimatedPrice: 42,
    wineryCity: 'St. Helena',
    wineryState: 'CA',
    wineryAddress: '3522 Silverado Trail',
    wineryUrl: 'https://www.rombauer.com',
    imageUrl: 'https://images.vivino.com/thumbs/8GjLX0LG7jvD_RK1v1WYWg_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/8GjLX0LG7jvD_RK1v1WYWg_375x500.jpg',
    description: 'Buttery and rich with notes of tropical fruit, vanilla, and toasted oak.',
  },
  {
    wineryName: 'Caymus Vineyards',
    wineName: 'Cabernet Sauvignon',
    varietal: 'Cabernet Sauvignon',
    year: 2021,
    estimatedPrice: 95,
    wineryCity: 'Rutherford',
    wineryState: 'CA',
    wineryAddress: '8700 Conn Creek Road',
    wineryUrl: 'https://www.caymus.com',
    imageUrl: 'https://images.vivino.com/thumbs/Gw8xqBD1pP0NsU9A5dYl6Q_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/Gw8xqBD1pP0NsU9A5dYl6Q_375x500.jpg',
    description: 'Bold and velvety with intense dark fruit, cocoa, and cassis.',
  },
  {
    wineryName: 'Kim Crawford',
    wineName: 'Sauvignon Blanc',
    varietal: 'Sauvignon Blanc',
    year: 2023,
    estimatedPrice: 15,
    wineryCity: 'Marlborough',
    wineryState: 'New Zealand',
    wineryAddress: 'Marlborough Region',
    wineryUrl: 'https://www.kimcrawfordwines.com',
    imageUrl: 'https://images.vivino.com/thumbs/OlJF5mCPK0DIKGtZYYk7Vw_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/OlJF5mCPK0DIKGtZYYk7Vw_375x500.jpg',
    description: 'Crisp and refreshing with citrus, tropical fruit, and herbaceous notes.',
  },
  {
    wineryName: 'Whispering Angel',
    wineName: 'Côtes de Provence Rosé',
    varietal: 'Rosé',
    year: 2023,
    estimatedPrice: 24,
    wineryCity: 'La Motte-en-Provence',
    wineryState: 'France',
    wineryAddress: 'Château d\'Esclans',
    wineryUrl: 'https://www.esclans.com',
    imageUrl: 'https://images.vivino.com/thumbs/ApnFiWsLoRkdpx6bWwMw6w_375x500.jpg',
    thumbnailUrl: 'https://images.vivino.com/thumbs/ApnFiWsLoRkdpx6bWwMw6w_375x500.jpg',
    description: 'Pale pink with delicate strawberry, citrus, and floral aromas.',
  },
];

// Varietal mappings
const VARIETAL_MAPPINGS: Record<string, string[]> = {
  'Pinot Noir': ['Pinot Noir'],
  'Chardonnay': ['Chardonnay'],
  'Cabernet Sauvignon': ['Cabernet Sauvignon'],
  'Sauvignon Blanc': ['Sauvignon Blanc'],
  'Rosé': ['Rosé'],
  'Dry Rosé': ['Rosé'],
  'Lighter Red': ['Pinot Noir'],
  'Full-bodied Red': ['Cabernet Sauvignon'],
  'Medium-bodied Red': ['Pinot Noir'],
  'Rich White': ['Chardonnay'],
  'Crisp White': ['Sauvignon Blanc'],
  'Light White': ['Sauvignon Blanc'],
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const winesService = app.get(WinesService);
  const mappingsService = app.get(VarietalMappingsService);

  console.log('Seeding database...');

  // Create wines
  const createdWines: { [varietal: string]: number[] } = {};

  for (const wineData of WINES_DATA) {
    const wine = await winesService.create(wineData);
    console.log(`Created wine: ${wine.wineName} (ID: ${wine.id})`);

    if (!createdWines[wine.varietal]) {
      createdWines[wine.varietal] = [];
    }
    createdWines[wine.varietal].push(wine.id);
  }

  // Create varietal mappings
  for (const [mappingVarietal, wineVarietals] of Object.entries(VARIETAL_MAPPINGS)) {
    for (const wineVarietal of wineVarietals) {
      const wineIds = createdWines[wineVarietal] || [];
      for (const wineId of wineIds) {
        await mappingsService.create({ varietal: mappingVarietal, wineId });
        console.log(`Mapped: ${mappingVarietal} -> Wine ID ${wineId}`);
      }
    }
  }

  console.log('Database seeded successfully!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
