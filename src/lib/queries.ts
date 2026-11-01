import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada.");
  return data.user.id;
}

function must<R extends { data: unknown; error: { message: string } | null }>(r: R): NonNullable<R["data"]> {
  if (r.error) throw new Error(r.error.message);
  return r.data as NonNullable<R["data"]>;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => must(await supabase.from("profiles").select("*").eq("id", await uid()).single()),
});
export const experiencesQuery = queryOptions({
  queryKey: ["experiences"],
  queryFn: async () => must(await supabase.from("experiences").select("*").order("created_at")),
});
export const educationsQuery = queryOptions({
  queryKey: ["educations"],
  queryFn: async () => must(await supabase.from("educations").select("*").order("created_at")),
});
export const jobsQuery = queryOptions({
  queryKey: ["jobs"],
  queryFn: async () => must(await supabase.from("jobs").select("*").order("created_at", { ascending: false })),
});
export const jobQuery = (id: string) =>
  queryOptions({
    queryKey: ["jobs", id],
    queryFn: async () => must(await supabase.from("jobs").select("*").eq("id", id).maybeSingle()),
  });
export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async () => must(await supabase.from("match_analyses").select("*").order("created_at", { ascending: false })),
});
export const resumesQuery = queryOptions({
  queryKey: ["resumes"],
  queryFn: async () => must(await supabase.from("resumes").select("*").order("updated_at", { ascending: false })),
});
export const resumeQuery = (id: string) =>
  queryOptions({
    queryKey: ["resumes", id],
    queryFn: async () => must(await supabase.from("resumes").select("*").eq("id", id).maybeSingle()),
  });
export const applicationsQuery = queryOptions({
  queryKey: ["applications"],
  queryFn: async () => must(await supabase.from("applications").select("*").order("updated_at", { ascending: false })),
});
