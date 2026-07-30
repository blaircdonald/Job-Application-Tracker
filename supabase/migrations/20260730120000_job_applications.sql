-- Job applications workflow for auto-apply agent
CREATE TYPE public.application_status AS ENUM (
  'queued',
  'detecting_fields',
  'missing_profile_info',
  'ready_to_submit',
  'submitting',
  'submitted',
  'failed'
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'queued',
  detected_platform text,
  detected_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  browserbase_session_id text,
  error_message text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS job_applications_user_id_idx
  ON public.job_applications(user_id);

CREATE INDEX IF NOT EXISTS job_applications_user_status_idx
  ON public.job_applications(user_id, status);

CREATE INDEX IF NOT EXISTS job_applications_job_id_idx
  ON public.job_applications(job_id);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job applications" ON public.job_applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job applications" ON public.job_applications
  FOR DELETE USING (auth.uid() = user_id);
