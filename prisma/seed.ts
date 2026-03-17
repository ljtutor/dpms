//import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '../app/generated/prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Positions
    const TeamLead = await prisma.positions.create({
        data: {
            title: "Team Lead",
        },
    });
    const FinanceOfficer = await prisma.positions.create({
        data: {
            title: "Finance Officer",
        },
    });
    const BusinessDevelopmentManager = await prisma.positions.create({
        data: {
            title: "Business Development Manager",
        },
    });
    const ProjectManager = await prisma.positions.create({
        data: {
            title: "Project Manager",
        },
    });
    const ITDeveloper = await prisma.positions.create({
        data: {
            title: "IT Developer",
        },
    });
    const ITTechnicalSupport = await prisma.positions.create({
        data: {
            title: "IT Technical Support",
        },
    });

    // Users
    await prisma.users.create({
        data: {
            first_name: "Louie Jay",
            middle_name: "Española",
            last_name: "Tutor",
            email: "ljtutor@dataplus.com.ph",
            password: await bcrypt.hash("Password@1234", 10),
            birthday: new Date("2001-05-23"),
            position_id: ITDeveloper.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Michaelangelo",
            middle_name: "Garcia",
            last_name: "Guevara Jr.",
            email: "mguevarajr@dataplus.com.ph",
            password: await bcrypt.hash("Password@1234", 10),
            birthday: new Date("2000-11-15"),
            position_id: ITDeveloper.id,
        },
    });

    console.log("Seeds data created.");
}

main().catch((e) => console.error(e)).finally(async () => {
    await prisma.$disconnect();
});