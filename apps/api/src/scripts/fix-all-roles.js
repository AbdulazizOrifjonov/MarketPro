import { prisma } from '../lib/prisma.js';

async function fixAllUserRoles() {
  console.log('--- Inspecting all users in DB ---');
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, username: true, role: true, adminLevel: true },
  });
  console.log('All Users:', JSON.stringify(allUsers, null, 2));

  // FORCE EVERY USER EXCEPT username '1234' TO CUSTOMER and adminLevel null!
  const updated = await prisma.user.updateMany({
    where: {
      NOT: { username: '1234' },
    },
    data: {
      role: 'CUSTOMER',
      adminLevel: null,
    },
  });

  console.log(`UPDATED ${updated.count} USERS TO CUSTOMER ROLE!`);

  const remainingAdmins = await prisma.user.findMany({
    where: { OR: [{ role: 'ADMIN' }, { adminLevel: { not: null } }] },
    select: { id: true, name: true, email: true, username: true, role: true, adminLevel: true },
  });
  console.log('Remaining Admins in DB:', JSON.stringify(remainingAdmins, null, 2));
}

fixAllUserRoles()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
