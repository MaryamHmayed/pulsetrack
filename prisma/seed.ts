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
  const clinician = await prisma.clinician.upsert({
    where: { email: 'test@pulsetrack.dev' },
    update: {},
    create: {
      email: 'test@pulsetrack.dev',
      passwordHash,
      name: 'Test Clinician',
    },
  })

  const patients = [
    {
      mrn: 'MRN-1001',
      fullName: 'Jane Doe',
      dob: new Date('1980-05-12T00:00:00.000Z'),
      sex: 'FEMALE' as const,
      email: 'jane.doe@example.com',
      phone: '+15550101001',
    },
    {
      mrn: 'MRN-1002',
      fullName: 'Michael Chen',
      dob: new Date('1974-09-23T00:00:00.000Z'),
      sex: 'MALE' as const,
      email: 'michael.chen@example.com',
      phone: '+15550101002',
    },
    {
      mrn: 'MRN-1003',
      fullName: 'Amina Hassan',
      dob: new Date('1991-02-08T00:00:00.000Z'),
      sex: 'FEMALE' as const,
      email: 'amina.hassan@example.com',
      phone: '+15550101003',
    },
  ]

  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { mrn: patient.mrn },
      update: { ...patient, clinicianId: clinician.id },
      create: { ...patient, clinicianId: clinician.id },
    })
  }

  console.log('Seeded test clinician and sample patients')
}

main()
  .catch((error) => {
    console.error('Seed failed')
    throw error
  })
  .finally(() => prisma.$disconnect())
