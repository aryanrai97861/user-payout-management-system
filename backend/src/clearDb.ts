import { prisma } from './db';
import bcrypt from 'bcrypt';

async function clearAndSeed() {
  console.log("Clearing transactions...");
  await prisma.transaction.deleteMany();
  
  console.log("Clearing sales...");
  await prisma.sale.deleteMany();
  
  console.log("Clearing users...");
  await prisma.user.deleteMany();

  console.log("Reseeding admin user...");
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@payoutflow.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log("Database successfully cleared and admin reseeded!");
}

clearAndSeed()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
