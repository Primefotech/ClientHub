const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tenants = await prisma.tenant.findMany({ take: 1 });
    console.log('Successfully connected to DB. Tenants:', tenants.length);
    process.exit(0);
  } catch (e) {
    console.error('Failed to connect to DB:', e);
    process.exit(1);
  }
}

main();
