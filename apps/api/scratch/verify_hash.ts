import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@brandbook.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const passwordsToTest = [
    'Admin@brandbook123',
    'admin123',
    'brandbook123',
    'admin@brandbook123'
  ];

  console.log('--- PASSWORD VERIFICATION ---');
  console.log('Email:', user.email);
  console.log('Stored Hash:', user.password);

  for (const pw of passwordsToTest) {
    const isValid = await bcrypt.compare(pw, user.password);
    console.log(`Testing "${pw}": ${isValid ? 'VALID' : 'INVALID'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
