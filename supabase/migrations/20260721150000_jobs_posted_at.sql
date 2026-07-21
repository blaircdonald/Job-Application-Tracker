-- Store original job post date separately from cache fetch time
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS posted_at timestamptz;

CREATE INDEX IF NOT EXISTS jobs_user_posted_at_idx ON public.jobs(user_id, posted_at DESC);
