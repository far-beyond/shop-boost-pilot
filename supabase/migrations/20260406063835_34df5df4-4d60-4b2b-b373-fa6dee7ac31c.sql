
CREATE TABLE public.free_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.free_whitelist ENABLE ROW LEVEL SECURITY;

-- Only allow read access for authenticated users (admin checks done in edge function)
CREATE POLICY "Authenticated users can view whitelist"
ON public.free_whitelist
FOR SELECT
TO authenticated
USING (true);
