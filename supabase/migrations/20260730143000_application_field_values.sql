ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS application_field_values jsonb NOT NULL DEFAULT '{}'::jsonb;
