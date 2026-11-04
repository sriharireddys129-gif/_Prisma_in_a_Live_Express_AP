
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@example.com'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@example.com'
    }
  });

  // Create sample products
  const products = [
    { name: 'Laptop', price: 50000, stock: 10 },
    { name: 'Mouse', price: 800, stock: 25 },
    { name: 'Keyboard', price: 1500, stock: 15 }
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    });

    if (!existing) {
      await prisma.product.create({
        data: product
      });
    }
  }

  console.log('Database seeded successfully!');
  console.log('Users:', user1.name, user2.name);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
