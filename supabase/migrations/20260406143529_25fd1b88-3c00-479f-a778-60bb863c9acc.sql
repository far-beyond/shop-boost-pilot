
CREATE TABLE public.plan_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_by text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan settings"
ON public.plan_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage plan settings"
ON public.plan_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.plan_settings (setting_key, setting_value) VALUES
  ('free_monthly_limit', '10'),
  ('pro_monthly_price', '2980'),
  ('free_trial_days', '0');
