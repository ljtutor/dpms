import bcrypt from "bcryptjs";

import { Role } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";

async function main() {
    // Departments
    await prisma.departments.create({
        data: {
            name: "IT Infrastructure and Development",
        },
    });
    await prisma.departments.create({
        data: {
            name: "Sales",
        },
    });
    await prisma.departments.create({
        data: {
            name: "Finance and Admin",
        },
    });

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
            email: "mark.david@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.MANAGER,
            employeeInformation: {
                create: {
                    firstName: "Mark Anthony",
                    lastName: "David",
                },
            },
            companyInformation: {
                create: {
                    positionId: TeamLead.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "suzi.david@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.MANAGER,
            employeeInformation: {
                create: {
                    firstName: "Suzi",
                    lastName: "David",
                },
            },
            companyInformation: {
                create: {
                    positionId: FinanceOfficer.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "aldebelen@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.MANAGER,
            employeeInformation: {
                create: {
                    firstName: "Anna Louise",
                    lastName: "De Belen",
                },
            },
            companyInformation: {
                create: {
                    positionId: BusinessDevelopmentManager.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "dbagub@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.MANAGER,
            employeeInformation: {
                create: {
                    firstName: "Delfin",
                    lastName: "Agub",
                },
            },
            companyInformation: {
                create: {
                    positionId: BusinessDevelopmentManager.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "dsabino@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.MANAGER,
            employeeInformation: {
                create: {
                    firstName: "Daniel",
                    lastName: "Sabino",
                },
            },
            companyInformation: {
                create: {
                    positionId: ProjectManager.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "ljtutor@dataplus.com.ph",
            password: await bcrypt.hash("Password@1234", 10),
            role: Role.ADMIN,
            employeeInformation: {
                create: {
                    firstName: "Louie Jay",
                    middleName: "Española",
                    lastName: "Tutor",
                    birthday: new Date("2001-05-23"),
                },
            },
            companyInformation: {
                create: {
                    positionId: ITDeveloper.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "mguevarajr@dataplus.com.ph",
            password: await bcrypt.hash("Password@1234", 10),
            role: Role.ADMIN,
            employeeInformation: {
                create: {
                    firstName: "Michaelangelo",
                    middleName: "Garcia",
                    lastName: "Guevara Jr.",
                    birthday: new Date("2000-11-15"),
                },
            },
            companyInformation: {
                create: {
                    positionId: ITDeveloper.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "cjcabrera@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.USER,
            employeeInformation: {
                create: {
                    firstName: "CJ",
                    lastName: "Cabrera",
                },
            },
            companyInformation: {
                create: {
                    positionId: ITDeveloper.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "iacapisanan@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.USER,
            employeeInformation: {
                create: {
                    firstName: "Ian Andrew",
                    lastName: "Capisanan",
                },
            },
            companyInformation: {
                create: {
                    positionId: ITTechnicalSupport.id,
                },
            },
        },
    });
    await prisma.users.create({
        data: {
            email: "jkignacio@dataplus.com.ph",
            password: await bcrypt.hash("Dataplus@2026", 10),
            role: Role.USER,
            employeeInformation: {
                create: {
                    firstName: "Jeremy Kemt",
                    lastName: "Ignacio",
                },
            },
            companyInformation: {
                create: {
                    positionId: ITTechnicalSupport.id,
                },
            },
        },
    });

    // Leaves
    await prisma.leaves.create({
        data: {
            type: "Vacation",
        },
    });
    await prisma.leaves.create({
        data: {
            type: "Sick",
        },
    });
    await prisma.leaves.create({
        data: {
            type: "Emergency",
        },
    });
    await prisma.leaves.create({
        data: {
            type: "No Pay Leave",
        },
    });

    console.log("Seeds data created.");
}

main().catch((e) => console.error(e)).finally(async () => {
    await prisma.$disconnect();
});