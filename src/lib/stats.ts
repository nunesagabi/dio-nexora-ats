type App = { id: string; status: string; title: string; company: string | null; next_step_at: string | null };
type Match = { job_id: string; score: number; created_at: string };

/** Dashboard metrics from the user's own rows. Average uses only the latest analysis per job. */
export function computeStats(apps: App[], matches: Match[], resumeCount: number, today = new Date().toISOString().slice(0, 10)) {
  const latest = new Map<string, number>();
  for (const m of [...matches].sort((a, b) => a.created_at.localeCompare(b.created_at))) latest.set(m.job_id, m.score);
  const scores = [...latest.values()];
  return {
    saved: apps.filter((a) => a.status === "saved").length,
    applied: apps.filter((a) => a.status !== "saved").length,
    interviews: apps.filter((a) => a.status === "interview").length,
    resumes: resumeCount,
    avgScore: scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null,
    upcoming: apps
      .filter((a) => a.next_step_at && a.next_step_at >= today && a.status !== "closed")
      .sort((a, b) => a.next_step_at!.localeCompare(b.next_step_at!))
      .slice(0, 5),
  };
}
