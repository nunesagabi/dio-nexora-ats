CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, headline text, location text, summary text,
  phone text, linkedin text,
  desired_roles text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  salary_expectation text,
  work_modes text[] NOT NULL DEFAULT '{}',
  seniority text,
  resume_path text,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  role text NOT NULL, company text NOT NULL,
  start_date text, end_date text, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  institution text NOT NULL, degree text NOT NULL,
  start_date text, end_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL, company text, location text, work_mode text, contract_type text, seniority text,
  description text, requirements text, source text NOT NULL DEFAULT 'manual',
  external_id text, url text, published_at timestamptz, salary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);
CREATE TABLE public.match_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  score int NOT NULL, explanation text, met text[] NOT NULL DEFAULT '{}', gaps text[] NOT NULL DEFAULT '{}', transferable text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  title text NOT NULL, content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  title text NOT NULL, company text,
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','applied','interview','offer','closed')),
  notes text, link text, applied_at date, next_step_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_usage (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_time ON public.ai_usage(user_id, created_at);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['experiences','educations','jobs','match_analyses','resumes','applications','ai_usage'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
  END LOOP;
END $$;
GRANT USAGE ON SEQUENCE public.ai_usage_id_seq TO authenticated;

CREATE POLICY "own resume files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own resume files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own resume files update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own resume files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);