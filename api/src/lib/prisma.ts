import { PrismaClient } from '@prisma/client';

// one client for the whole process — avoids exhausting DB connections
// in dev when the file gets re-imported by hot reload
export const prisma = new PrismaClient();