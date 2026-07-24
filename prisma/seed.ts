import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10)
  await prisma.clinician.upsert({
    where: { email: 'test@pulsetrack.dev' },
    update: {},
    create: {
      email: 'test@pulsetrack.dev',
      passwordHash,
      name: 'Test Clinician',
    },
  })
  console.log('Seeded test clinician')
}

main().finally(() => prisma.$disconnect())
