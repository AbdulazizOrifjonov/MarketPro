import { prisma } from '../lib/prisma.js';

async function resetRoles() {
  console.log('Resetting non-superadmin roles to CUSTOMER...');
  
  // Set all users except Super Admin (username 1234 or adminLevel SUPER_ADMIN) to CUSTOMER
  const result = await prisma.user.updateMany({
    where: {
      NOT: {
        OR: [
          { username: '1234' },
          { adminLevel: 'SUPER_ADMIN' },
        ],
      },
    },
    data: {
      role: 'CUSTOMER',
      adminLevel: null,
    },
  });

  console.log(`Updated ${result.count} users to CUSTOMER role! Only Super Admin remains ADMIN.`);
}

resetRoles()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
