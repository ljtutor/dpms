import { Metadata } from "next";
import { notFound } from "next/navigation";

import RequestLeaveDetailClient from "@/components/requests/leave/detail/client";
import prisma from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

function bytesToDataUrl(bytes: Uint8Array): string {
    const buf = Buffer.from(bytes);
    const mime = buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
}

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

    const { eSignature, ...rest } = leaveRequest;

    const serialized = {
        ...rest,
        dateFiled: leaveRequest.dateFiled.toISOString(),
        dateFrom: leaveRequest.dateFrom.toISOString(),
        dateTo: leaveRequest.dateTo.toISOString(),
        dateApproved: leaveRequest.dateApproved?.toISOString() ?? null,
        dateAccepted: leaveRequest.dateAccepted?.toISOString() ?? null,
        signatureDataUrl: eSignature ? bytesToDataUrl(eSignature) : null,
    };

    return <RequestLeaveDetailClient request={serialized as any}/>;
}
