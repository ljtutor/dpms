//import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.users.create({
        data: {
            first_name: "Louie Jay",
            middle_name: "Española",
            last_name: "Tutor",
            email: "ljtutor@dataplus.com.ph",
            birthday: new Date("2001-05-23"),
        },
    });

    await prisma.users.create({
        data: {
            first_name: "Michaelangelo",
            middle_name: "Garcia",
            last_name: "Guevara Jr.",
            email: "mguevarajr@dataplus.com.ph",
            birthday: new Date("2000-11-15"),
        },
    });

    console.log("Seed users created.");
}

main().catch((e) => console.error(e)).finally(async () => {
    await prisma.$disconnect();
});