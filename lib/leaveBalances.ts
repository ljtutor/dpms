import { Period, Role } from "@/app/generated/prisma/enums";

const getPeriods = (start: Date, end: Date, period: string) => {
    const diffMs = end.getTime() - start.getTime();

    switch (period) {
        case Period.DAY:
            return Math.floor(diffMs / (1000 * 60 * 60 * 24));

        case Period.WEEK:
            return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

        case Period.MONTH:
            return ((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));

        case Period.YEAR:
            return end.getFullYear() - start.getFullYear();

        default:
            return 0;
    }
};

export function getEarnedLeaves(
    user: any,
    leave: any
) {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const now = new Date();

    const periods = getPeriods(start, now, leave.accrualPeriod);

    let rate = 0;
    switch (user.role) {
        case Role.MANAGER:
        case Role.ADMIN:
            rate = leave.accrualRateManager;
            break;
        case Role.USER:
            rate = leave.accrualRateUser;
            break;
    }
    const earned = periods * rate;

    return Math.max(earned, 0);
}

export function getUsedLeaves(
    user: any,
    leave: any,
    leaveRequests: any[]
) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const used = leaveRequests.filter(request =>
        request.userId === user.id &&
        request.leaveTypeId === leave.id &&
        new Date(request.dateFrom) <= endOfYear &&
        new Date(request.dateTo) >= startOfYear &&
        request.isApproved &&
        request.isAccepted
    ).reduce((total, request) => total + request.noOfDays, 0);

    return Math.max(used, 0);
}

export function getAvailableLeaves(
    user: any,
    leave: any,
    leaveRequests: any[]
) {
    const earned = getEarnedLeaves(user, leave);
    const used = getUsedLeaves(user, leave, leaveRequests);
    const available = earned - used;

    return Math.max(available, 0);
}

export function getRemainingLeaves(
    user: any,
    leave: any,
    leaveRequests: any[]
) {
    const remaining = getAvailableLeaves(user, leave, leaveRequests);

    return Math.max(remaining, 0);
}