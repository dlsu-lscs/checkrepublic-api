import 'dotenv/config';
import { PrismaService } from '../src/shared/database/prisma.service';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = new PrismaService(databaseUrl);

try {
  const { users, projects } = await prisma.$transaction(async (tx) => {
    const users = [];
    const projects = [];

    for (let userNumber = 1; userNumber <= 10; userNumber++) {
      const email = userNumber === 1 ? 'dev@dlsu.edu.ph' : `dev${userNumber}@dlsu.edu.ph`;
      const user = await tx.user.upsert({
        where: { email },
        update: {},
        create: {
          googleSubject: `seed-development-user-${userNumber}`,
          email,
          fullName: `Development User ${userNumber}`,
        },
      });
      users.push(user);

      for (let projectOffset = 0; projectOffset < 2; projectOffset++) {
        const projectNumber = (userNumber - 1) * 2 + projectOffset + 1;
        const projectId =
          projectNumber === 1
            ? '22222222-2222-4222-8222-222222222222'
            : `22222222-2222-4222-8222-${String(projectNumber).padStart(12, '0')}`;
        const project = await tx.project.upsert({
          where: { id: projectId },
          update: {},
          create: {
            id: projectId,
            userId: user.id,
            name: `Sample project ${projectNumber}`,
          },
        });
        projects.push(project);
      }
    }

    return { users, projects };
  });

  console.info(`Seeded ${users.length} users and ${projects.length} projects`);
  console.table(users, ['id', 'email']);
  console.table(projects, ['id', 'userId', 'name']);
} finally {
  await prisma.$disconnect();
}
