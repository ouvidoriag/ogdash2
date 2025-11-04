import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.record.count();
  await prisma.record.deleteMany({});
  const after = await prisma.record.count();
  console.log(JSON.stringify({ before, after }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });


