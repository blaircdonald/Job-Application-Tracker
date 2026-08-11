-- Remove LinkedIn as a searchable job platform
DELETE FROM public.jobs WHERE platform = 'linkedin';

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_platform_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_platform_check
  CHECK (
    platform = ANY (
      ARRAY[
        'greenhouse'::text,
        'lever'::text,
        'workable'::text,
        'wellfound'::text,
        'indeed'::text
      ]
    )
  );
