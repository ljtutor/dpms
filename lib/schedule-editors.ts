/** Positions allowed to view/edit schedules (self or others). Must match `Positions.title`. */
export const SCHEDULE_EDITOR_POSITION_TITLES = [
  "Team Lead",
  "Finance Officer",
  "Business Development Manager",
  "Project Manager",
] as const;

export function canEditEmployeeSchedules(positionTitle: string | null | undefined): boolean {
  if (!positionTitle) return false;
  return (SCHEDULE_EDITOR_POSITION_TITLES as readonly string[]).includes(positionTitle);
}

/** Approve/reject time log edit requests (same positions as schedule editors). */
export function canApproveTimeLogEdits(positionTitle: string | null | undefined): boolean {
  return canEditEmployeeSchedules(positionTitle);
}
