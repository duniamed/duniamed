-- AI Recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Exports table for PDF storage
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Form autofill cache
CREATE TABLE IF NOT EXISTS public.autofill_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autofill_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations"
  ON public.recommendations
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for exports
CREATE POLICY "Users can view own exports"
  ON public.exports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports"
  ON public.exports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update exports"
  ON public.exports
  FOR UPDATE
  USING (true);

-- RLS Policies for autofill_suggestions
CREATE POLICY "Users can manage own autofill"
  ON public.autofill_suggestions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at DESC);
CREATE INDEX idx_exports_user_id ON public.exports(user_id);
CREATE INDEX idx_exports_status ON public.exports(status);
CREATE INDEX idx_autofill_user_field ON public.autofill_suggestions(user_id, field_name);