import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin
  const adminPassword = await bcrypt.hash('Admin@brandbook123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@brandbook.com' },
    update: {},
    create: {
      email: 'admin@brandbook.com',
      password: adminPassword,
      name: 'BrandBook Admin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('✅ Super Admin:', superAdmin.email);

  // Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-client' },
    update: {},
    create: {
      name: 'Demo Client Co.',
      slug: 'demo-client',
      industry: 'E-Commerce',
    },
  });

  // Project Head
  const phPassword = await bcrypt.hash('PH@brandbook123', 12);
  const ph = await prisma.user.upsert({
    where: { email: 'ph@brandbook.com' },
    update: {},
    create: {
      email: 'ph@brandbook.com',
      password: phPassword,
      name: 'Project Head',
      role: Role.PROJECT_HEAD,
    },
  });

  // BrandBook Staff
  const staffPassword = await bcrypt.hash('Staff@brandbook123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@brandbook.com' },
    update: {},
    create: {
      email: 'staff@brandbook.com',
      password: staffPassword,
      name: 'BrandBook Staff',
      role: Role.BRANDBOOK_STAFF,
    },
  });

  // Client Owner
  const coPassword = await bcrypt.hash('Client@brandbook123', 12);
  const clientOwner = await prisma.user.upsert({
    where: { email: 'owner@democlient.com' },
    update: {},
    create: {
      email: 'owner@democlient.com',
      password: coPassword,
      name: 'Client Owner',
      role: Role.CLIENT_OWNER,
    },
  });

  // Client Staff
  const csPassword = await bcrypt.hash('Staff@client123', 12);
  const clientStaff = await prisma.user.upsert({
    where: { email: 'staff@democlient.com' },
    update: {},
    create: {
      email: 'staff@democlient.com',
      password: csPassword,
      name: 'Client Staff Member',
      role: Role.CLIENT_STAFF,
    },
  });

  // Assign users to tenant
  for (const userId of [ph.id, staff.id, clientOwner.id, clientStaff.id]) {
    await prisma.tenantUser.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId } },
      update: {},
      create: { tenantId: tenant.id, userId },
    });
  }

  // Demo Project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-001' },
    update: {},
    create: {
      id: 'demo-project-001',
      tenantId: tenant.id,
      name: 'Social Media Q2 Campaign',
      description: 'Full-funnel social media campaign for Q2 2026',
      color: '#6366f1',
      icon: '📱',
    },
  });

  // Assign project users
  const assignments = [
    { userId: ph.id, role: Role.PROJECT_HEAD },
    { userId: staff.id, role: Role.BRANDBOOK_STAFF },
    { userId: clientOwner.id, role: Role.CLIENT_OWNER },
    { userId: clientStaff.id, role: Role.CLIENT_STAFF },
  ];

  for (const a of assignments) {
    await prisma.projectUser.upsert({
      where: { projectId_userId: { projectId: project.id, userId: a.userId } },
      update: {},
      create: { projectId: project.id, ...a },
    });
  }

  // Global Content Types
  const contentTypes = [
    { name: 'Social Media Post', icon: '📸', color: '#ec4899', isGlobal: true, defaultApprovalRequired: true },
    { name: 'Video Ad', icon: '🎬', color: '#8b5cf6', isGlobal: true, defaultApprovalRequired: true },
    { name: 'Carousel', icon: '🎠', color: '#f59e0b', isGlobal: true, defaultApprovalRequired: true },
    { name: 'Ad Copy', icon: '✍️', color: '#10b981', isGlobal: true, defaultApprovalRequired: true },
    { name: 'Story', icon: '📖', color: '#3b82f6', isGlobal: true, defaultApprovalRequired: false },
  ];

  for (const ct of contentTypes) {
    await prisma.contentType.create({ data: { ...ct, createdById: superAdmin.id } }).catch(() => {});
  }

  // Approval Rule
  await prisma.approvalRule.create({
    data: {
      projectId: project.id,
      name: 'Default Approval Rule',
      requiresApproval: true,
      approvalDeadlineHours: 48,
      autoApproveAfterDeadline: false,
      requiresClientApproval: true,
    },
  }).catch(() => {});

  // Onboarding Form
  const form = await prisma.onboardingForm.create({
    data: {
      projectId: project.id,
      title: 'Campaign Brief',
      description: 'Please fill in your campaign requirements',
      mode: 'PH_FILLED',
      shareToken: 'demo-token-001',
    },
  }).catch(() => null);

  if (form) {
    await prisma.onboardingField.createMany({
      data: [
        { formId: form.id, label: 'Brand Name', fieldType: 'TEXT', isRequired: true, order: 1 },
        { formId: form.id, label: 'Target Audience', fieldType: 'TEXTAREA', isRequired: true, order: 2 },
        { formId: form.id, label: 'Campaign Goals', fieldType: 'MULTISELECT', options: JSON.stringify(['Brand Awareness', 'Lead Generation', 'Sales', 'Engagement']) as any, order: 3 },
        { formId: form.id, label: 'Monthly Budget (USD)', fieldType: 'NUMBER', isRequired: true, order: 4 },
        { formId: form.id, label: 'Start Date', fieldType: 'DATE', order: 5 },
      ],
    }).catch(() => {});
  }

  console.log('✅ Seed complete!');
  console.log('\n🔐 Demo credentials:');
  console.log('  Super Admin: admin@brandbook.com / Admin@brandbook123');
  console.log('  Project Head: ph@brandbook.com / PH@brandbook123');
  console.log('  Staff: staff@brandbook.com / Staff@brandbook123');
  console.log('  Client Owner: owner@democlient.com / Client@brandbook123');
  console.log('  Client Staff: staff@democlient.com / Staff@client123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
