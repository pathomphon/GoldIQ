import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Seed data is restricted to NODE_ENV=development.');
  }

  await prisma.applicationSetting.upsert({
    where: { key: 'foundation.phase' },
    create: {
      key: 'foundation.phase',
      value: { phase: 1, status: 'ready' },
      description: 'Development-only marker for the active project phase.',
    },
    update: {
      value: { phase: 1, status: 'ready' },
    },
  });
}

seed()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown seed failure';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
