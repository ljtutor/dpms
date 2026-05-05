import { Metadata } from "next";
import { notFound } from "next/navigation";

import RequestLeaveDetailClient from "@/components/requests/leave/detail/client";
import prisma from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    
    return {
        title: `Leave Application - ${id}`
    };
}

export default async function LeaveRequestDetail({ params }: PageProps) {
    const { id } = await params;
    const numId = Number(id);
    if (Number.isNaN(numId)) notFound();

    const leaveRequest = await prisma.leaveRequests.findUnique({
        where: {
            id: numId
        },
        include: {
            user: {
                include: {
                    employeeInformation: true,
                    companyInformation: {
                        include: {
                            position: true
                        }
                    },
                },
            },
            leaveType: true,
            approvedBy: {
                include: {
                    employeeInformation: true
                }
            },
            receiver: {
                include: {
                    employeeInformation: true
                }
            },
        },
    });

    if (!leaveRequest) notFound();

    const serialized = {
        ...leaveRequest,
        dateFiled: leaveRequest.dateFiled.toISOString(),
        dateFrom: leaveRequest.dateFrom.toISOString(),
        dateTo: leaveRequest.dateTo.toISOString(),
        dateApproved: leaveRequest.dateApproved?.toISOString() ?? null,
        dateAccepted: leaveRequest.dateAccepted?.toISOString() ?? null,
        eSignature: leaveRequest.user.employeeInformation?.eSignature,
    };

    return <RequestLeaveDetailClient request={serialized as any}/>;
}
