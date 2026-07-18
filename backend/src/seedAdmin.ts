import { prisma } from './db';
import bcrypt from 'bcrypt';

async function seed() {
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) {
    console.log("Admin already exists!");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@payoutflow.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log("Admin user seeded: admin@payoutflow.com / admin123");
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
