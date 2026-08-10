-- Daily apply quota: 50 per calendar day (America/New_York), resets at midnight
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_applies_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_applies_date date;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_daily_applies_used_nonnegative;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_daily_applies_used_nonnegative
  CHECK (daily_applies_used >= 0);

COMMENT ON COLUMN public.profiles.daily_applies_used IS 'Number of applies used on daily_applies_date';
COMMENT ON COLUMN public.profiles.daily_applies_date IS 'Calendar date (America/New_York) for daily_applies_used';
