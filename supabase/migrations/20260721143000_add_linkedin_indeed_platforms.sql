-- Allow linkedin and indeed platforms in jobs table
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_platform_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_platform_check
  CHECK (platform IN (
    'greenhouse',
    'lever',
    'workable',
    'wellfound',
    'linkedin',
    'indeed'
  ));
