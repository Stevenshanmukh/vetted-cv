
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, name: true, id: true }
    });
    console.log('Existing Users:', users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
