import { PrismaClient } from '../app/generated/prisma/client';
import { Role } from '../app/generated/prisma/enums';

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
            first_name: "Mark Anthony",
            last_name: "David",
            email: "mark.david@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: TeamLead.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Suzi",
            last_name: "David",
            email: "suzi.david@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: FinanceOfficer.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Anna Louise",
            last_name: "De Belen",
            email: "aldebelen@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: BusinessDevelopmentManager.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Delfin",
            last_name: "Agub",
            email: "dbagub@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: BusinessDevelopmentManager.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Daniel",
            last_name: "Sabino",
            email: "dsabino@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: ProjectManager.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Louie Jay",
            middle_name: "Española",
            last_name: "Tutor",
            email: "ljtutor@dataplus.com.ph",
            password: await bcrypt.hash("Password@1234", 10),
            birthday: new Date("2001-05-23"),
            position_id: ITDeveloper.id,
            role: Role.ADMIN
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
            role: Role.ADMIN
        },
    });
    await prisma.users.create({
        data: {
            first_name: "CJ",
            last_name: "Cabrera",
            email: "cjcabrera@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: ITDeveloper.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Ian Andrew",
            last_name: "Capisanan",
            email: "iacapisanan@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: ITTechnicalSupport.id,
        },
    });
    await prisma.users.create({
        data: {
            first_name: "Jeremy Kemt",
            last_name: "Ignacio",
            email: "jkignacio@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            position_id: ITTechnicalSupport.id,
        },
    });

    console.log("Seeds data created.");
}

main().catch((e) => console.error(e)).finally(async () => {
    await prisma.$disconnect();
});