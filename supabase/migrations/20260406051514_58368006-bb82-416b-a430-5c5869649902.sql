
-- Create store_candidates table
CREATE TABLE public.store_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_candidates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own store candidates"
  ON public.store_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own store candidates"
  ON public.store_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own store candidates"
  ON public.store_candidates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own store candidates"
  ON public.store_candidates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_store_candidates_updated_at
  BEFORE UPDATE ON public.store_candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
