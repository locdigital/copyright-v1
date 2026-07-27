import { PrismaClient } from '@prisma/client'

export const prisma = globalThis.__imagecopyPrisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__imagecopyPrisma = prisma
}
