"use client";

import { useCallback, useEffect, useState } from "react";

type PendingRequest = {
  id: number;
  status: string;
  createdAt: string;
  employeeNote: string | null;
  proposedClockIn: string;
  proposedKind: string;
  proposedTaskDescription: string | null;
  requester: { id: number; name: string; position: string | null };
  timeEntry: {
    id: number;
    clockIn: string;
    kind: string;
    taskDescription: string | null;
    isLate: boolean | null;
  };
};

type MyRequest = {
  id: number;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewerComment: string | null;
  proposedClockIn: string;
  proposedKind: string;
  proposedTaskDescription: string | null;
  employeeNote: string | null;
  timeEntryId: number;
  timeEntry: { id: number; clockIn: string; kind: string };
};

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function TimeLogEditsPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [mine, setMine] = useState<MyRequest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        setSessionReady(false);
        return;
      }
      const meData = await meRes.json();
      const approve = Boolean(meData?.user?.canApproveTimeLogEdits);
      setCanApprove(approve);
      setSessionReady(true);

      const mineRes = await fetch("/api/time-entry/edit-requests?scope=mine", { credentials: "include" });
      if (mineRes.ok) {
        const d = await mineRes.json();
        setMine((d.requests ?? []) as MyRequest[]);
      }

      if (approve) {
        const pRes = await fetch("/api/time-entry/edit-requests?scope=pending", { credentials: "include" });
        if (pRes.ok) {
          const d = await pRes.json();
          setPending((d.requests ?? []) as PendingRequest[]);
        }
      } else {
        setPending([]);
      }
    } catch {
      setLoadError("Could not load requests.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: number, action: "approve" | "reject") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/time-entry/edit-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewerComment: reviewComment[id]?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(typeof err.error === "string" ? err.error : "Action failed.");
        return;
      }
      setReviewComment((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } finally {
      setActionId(null);
    }
  };

  if (!sessionReady) {
    return (
      <section className="px-4 py-6 lg:px-8">
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Time log edits</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {canApprove ? (
            <>
              Submit new edit requests from <span className="font-medium text-gray-700 dark:text-gray-300">Timekeeping</span>.
              Approvers use <span className="font-medium text-gray-700 dark:text-gray-300">Pending review</span> below; everyone
              can track their own submissions under <span className="font-medium text-gray-700 dark:text-gray-300">My edit requests</span>.
            </>
          ) : (
            <>
              View the status of your submitted changes (read-only here). To request an edit to a log, use{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">Timekeeping</span> → <span className="font-medium text-gray-700 dark:text-gray-300">Edit</span> on a row.
            </>
          )}
        </p>

        {loadError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

        {canApprove && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending review</h2>
            {pending.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No pending edit requests.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {pending.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.requester.name}
                      {r.requester.position ? (
                        <span className="font-normal text-gray-500 dark:text-gray-400"> — {r.requester.position}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Submitted {formatDt(r.createdAt)}</p>
                    <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-200 sm:grid-cols-2">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Current: </span>
                        {formatDt(r.timeEntry.clockIn)} · {r.timeEntry.kind}
                        {r.timeEntry.taskDescription ? ` — ${r.timeEntry.taskDescription}` : ""}
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Proposed: </span>
                        {formatDt(r.proposedClockIn)} · {r.proposedKind}
                        {r.proposedTaskDescription ? ` — ${r.proposedTaskDescription}` : ""}
                      </div>
                    </div>
                    {r.employeeNote && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Employee note: </span>
                        {r.employeeNote}
                      </p>
                    )}
                    <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Comment (optional)
                    </label>
                    <textarea
                      value={reviewComment[r.id] ?? ""}
                      onChange={(e) =>
                        setReviewComment((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      rows={2}
                      className="mt-1 w-full max-w-lg rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={actionId === r.id}
                        onClick={() => review(r.id, "approve")}
                        className="dpms-btn-submit-request"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionId === r.id}
                        onClick={() => review(r.id, "reject")}
                        className="dpms-btn-reject"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className={canApprove ? "mt-10" : "mt-8"}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My edit requests</h2>
          {!canApprove && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Only your own requests are shown. Approvals are handled by manager-level approvers or admins.
            </p>
          )}
          {mine.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You have not submitted any log edit requests.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {mine.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={
                        r.status === "PENDING"
                          ? "dpms-status-pending"
                          : r.status === "APPROVED"
                            ? "dpms-status-approved"
                            : "dpms-status-rejected"
                      }
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDt(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-200">
                    Proposed: {formatDt(r.proposedClockIn)} · {r.proposedKind}
                    {r.proposedTaskDescription ? ` — ${r.proposedTaskDescription}` : ""}
                  </p>
                  {r.reviewedAt && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Reviewed {formatDt(r.reviewedAt)}</p>
                  )}
                  {r.reviewerComment && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Comment: {r.reviewerComment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
