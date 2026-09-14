import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding President\'s College Leave System demo data...');

  await prisma.leavePolicy.upsert({
    where: { key: 'default' },
    update: {},
    create: { key: 'default' },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@presidentscollege.edu.gy' },
    update: {},
    create: {
      email: 'admin@presidentscollege.edu.gy',
      passwordHash: await hash('Admin@12345'),
      role: Role.ADMIN,
      mustChangePassword: false,
      admin: { create: { firstName: 'System', lastName: 'Administrator' } },
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@presidentscollege.edu.gy' },
    update: {},
    create: {
      email: 'staff@presidentscollege.edu.gy',
      passwordHash: await hash('Staff@12345'),
      role: Role.STAFF,
      mustChangePassword: false,
      staff: { create: { firstName: 'Jane', lastName: 'Persaud', department: 'Dean of Students' } },
    },
  });

  const officerUser = await prisma.user.upsert({
    where: { email: 'security@presidentscollege.edu.gy' },
    update: {},
    create: {
      email: 'security@presidentscollege.edu.gy',
      passwordHash: await hash('Security@12345'),
      role: Role.SECURITY,
      mustChangePassword: false,
      securityOfficer: {
        create: {
          firstName: 'Compton',
          lastName: 'Fraser',
          badgeNumber: 'SEC-001',
          postLocation: 'Main Gate',
        },
      },
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      phone: '+5926001234',
      passwordHash: await hash('Parent@12345'),
      role: Role.PARENT,
      mustChangePassword: false,
      parent: { create: { firstName: 'Michelle', lastName: 'Fields', relationship: 'Mother' } },
    },
    include: { parent: true },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@presidentscollege.edu.gy' },
    update: {},
    create: {
      email: 'student@presidentscollege.edu.gy',
      passwordHash: await hash('Student@12345'),
      role: Role.STUDENT,
      mustChangePassword: false,
      student: {
        create: {
          studentIdCode: 'PC-2026-0001',
          firstName: 'Kevin',
          lastName: 'Fields',
          dormitory: 'Burnham House',
          gradeLevel: 'Form 5',
          isBoarder: true,
        },
      },
    },
    include: { student: true },
  });

  const parentProfile = await prisma.parent.findUniqueOrThrow({ where: { userId: parentUser.id } });
  const studentProfile = await prisma.student.findUniqueOrThrow({ where: { userId: studentUser.id } });

  await prisma.studentGuardian.upsert({
    where: {
      studentId_parentId: { studentId: studentProfile.id, parentId: parentProfile.id },
    },
    update: {},
    create: {
      studentId: studentProfile.id,
      parentId: parentProfile.id,
      isPrimary: true,
      canApprove: true,
    },
  });

  console.log('Seed complete. Demo accounts (password shown for dev only):');
  console.table([
    { role: 'ADMIN', email: adminUser.email, password: 'Admin@12345' },
    { role: 'STAFF', email: staffUser.email, password: 'Staff@12345' },
    { role: 'SECURITY', email: officerUser.email, password: 'Security@12345' },
    { role: 'PARENT', email: parentUser.email, password: 'Parent@12345' },
    { role: 'STUDENT', email: studentUser.email, password: 'Student@12345' },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
