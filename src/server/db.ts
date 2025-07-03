import { PrismaClient } from '@prisma/client'

import { env } from '@/lib/env'

const createPrismaClient = () => {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Export a function to explicitly close the connection if needed
export async function disconnectDB() {
  await db.$disconnect()
}
