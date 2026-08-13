import { PrismaClient } from '@prisma/client';

// one client for the whole process — avoids exhausting DB connections
// in dev when the file gets re-imported by hot reload
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Graceful shutdown — close DB connection when process exits
process.on('exit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});