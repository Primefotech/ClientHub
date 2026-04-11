import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultMilestones = [
  { id: 'proposal', label: 'Proposal Sent', status: 'pending' },
  { id: 'payment', label: 'Payment Received', status: 'locked' },
  { id: 'kickoff', label: 'Project Kickoff', status: 'locked' },
  { id: 'design', label: 'Design & Development', status: 'locked' },
  { id: 'review', label: 'Review & Feedback', status: 'locked' },
  { id: 'delivery', label: 'Project Delivery', status: 'locked' },
];

async function main() {
  const projects = await prisma.project.findMany();
  console.log(`Found ${projects.length} projects`);

  for (const project of projects) {
    if (!project.milestones || (Array.isArray(project.milestones) && project.milestones.length === 0)) {
      console.log(`Initializing milestones for project: ${project.name} (${project.id})`);
      await prisma.project.update({
        where: { id: project.id },
        data: { milestones: defaultMilestones },
      });
    }
  }
  console.log('Finished initializing milestones');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
