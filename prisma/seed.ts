import { PrismaClient, LabelStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Js/xWQA0jZLdTb6/G'; // "password123"
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    },
  });

  console.log('✅ Test user created:', user.email);

  // Create subscription for user
  await prisma.subscription.create({
    data: {
      userId: user.id,
      type: 'FREE',
      status: 'ACTIVE',
    },
  });

  // Create test projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Product Labels',
      description: 'Labels for our product line',
      color: '#3B82F6',
      icon: '📦',
      userId: user.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Marketing Materials',
      description: 'Labels and stickers for marketing campaigns',
      color: '#10B981',
      icon: '📈',
      userId: user.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Event Badges',
      description: 'Name badges and event labels',
      color: '#F59E0B',
      icon: '🎪',
      userId: user.id,
    },
  });

  console.log('✅ Projects created:', [project1.name, project2.name, project3.name]);

  // Create test labels
  const labels = [
    {
      name: 'Default Product Label',
      description: 'Default label for new products',
      projectId: project1.id,
      width: 400,
      height: 300,
      status: 'DRAFT' as LabelStatus,
    },
    {
      name: 'Premium Product Label',
      description: 'Premium product line label',
      projectId: project1.id,
      width: 500,
      height: 400,
      status: 'PUBLISHED' as LabelStatus,
    },
    {
      name: 'Campaign Sticker',
      description: 'Summer campaign promotional sticker',
      projectId: project2.id,
      width: 300,
      height: 300,
      status: 'PUBLISHED' as LabelStatus,
    },
    {
      name: 'Event Badge Template',
      description: 'Template for event attendee badges',
      projectId: project3.id,
      width: 350,
      height: 200,
      status: 'DRAFT' as LabelStatus,
    },
  ];

  for (const labelData of labels) {
    await prisma.label.create({
      data: labelData,
    });
  }

  console.log('✅ Labels created:', labels.length);
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
