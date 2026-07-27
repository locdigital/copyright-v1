import { PrismaClient } from '@prisma/client'
import { env } from './config/env.js'

export const prisma = globalThis.__imagecopyPrisma || new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__imagecopyPrisma = prisma
}
