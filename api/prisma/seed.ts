import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// order matches the frontend's <option value="1..14"> lists exactly —
// autoincrement ids will land on 1..14 in a fresh database
const cities = [
  { name: 'Addis Ababa', lat: 9.0250, lng: 38.7469, region: 'Addis Ababa' },
  { name: 'Adama', lat: 8.5400, lng: 39.2700, region: 'Oromia' },
  { name: 'Hawassa', lat: 7.0500, lng: 38.4700, region: 'Sidama' },
  { name: 'Bahir Dar', lat: 11.5936, lng: 37.3908, region: 'Amhara' },
  { name: 'Mekelle', lat: 13.4967, lng: 39.4767, region: 'Tigray' },
  { name: 'Dire Dawa', lat: 9.5931, lng: 41.8661, region: 'Dire Dawa' },
  { name: 'Jimma', lat: 7.6733, lng: 36.8344, region: 'Oromia' },
  { name: 'Gondar', lat: 12.6030, lng: 37.4667, region: 'Amhara' },
  { name: 'Dessie', lat: 11.1330, lng: 39.6330, region: 'Amhara' },
  { name: 'Debre Birhan', lat: 9.6790, lng: 39.5300, region: 'Amhara' },
  { name: 'Shashemene', lat: 7.2000, lng: 38.6000, region: 'Oromia' },
  { name: 'Arba Minch', lat: 6.0333, lng: 37.5500, region: 'South Ethiopia' },
  { name: 'Nekemte', lat: 9.0900, lng: 36.5500, region: 'Oromia' },
  { name: 'Woldiya', lat: 11.8330, lng: 39.6000, region: 'Amhara' },
];

const truckTypes = ['Flatbed', 'Refrigerated', 'Box truck', 'Tanker'];
const cargoTypes = ['General goods', 'Perishable', 'Construction material', 'Livestock'];

async function main() {
  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
  }

  for (const name of truckTypes) {
    await prisma.truckType.upsert({ where: { name }, update: {}, create: { name } });
  }
   
  for (const name of cargoTypes) {
    await prisma.cargoType.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seed complete:', cities.length, 'cities,', truckTypes.length, 'truck types,', cargoTypes.length, 'cargo types');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());