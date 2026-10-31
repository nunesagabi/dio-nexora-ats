import { describe, expect, it } from "vitest";
import { computeStats } from "@/lib/stats";
import { validateResumeFile } from "@/lib/jobs";

describe("dashboard stats", () => {
  it("averages only the latest match per job", () => {
    const s = computeStats([], [
      { job_id: "a", score: 40, created_at: "2026-01-01" },
      { job_id: "a", score: 80, created_at: "2026-01-02" },
      { job_id: "b", score: 60, created_at: "2026-01-01" },
    ], 0);
    expect(s.avgScore).toBe(70);
  });
  it("counts interviews and non-saved as applications", () => {
    const apps = [
      { id: "1", status: "saved", title: "x", company: null, next_step_at: null },
      { id: "2", status: "interview", title: "y", company: null, next_step_at: null },
      { id: "3", status: "applied", title: "z", company: null, next_step_at: null },
    ];
    const s = computeStats(apps, [], 2);
    expect([s.saved, s.applied, s.interviews]).toEqual([1, 2, 1]);
  });
});

describe("resume upload", () => {
  it("rejects files over 5 MB", () => {
    expect(validateResumeFile({ type: "application/pdf", name: "a.pdf", size: 6 * 1024 * 1024 })).not.toBeNull();
  });
  it("rejects non-PDF files", () => {
    expect(validateResumeFile({ type: "image/png", name: "a.png", size: 100 })).not.toBeNull();
  });
});
