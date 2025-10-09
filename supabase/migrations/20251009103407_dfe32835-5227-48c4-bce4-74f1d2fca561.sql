-- Enable RLS on semantic_search_cache
ALTER TABLE public.semantic_search_cache ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage search cache
CREATE POLICY "System manages search cache"
  ON public.semantic_search_cache
  FOR ALL
  USING (true);

-- Helper function for semantic search
CREATE OR REPLACE FUNCTION public.search_user_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content_type text,
  content_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    user_id,
    content_type,
    content_text,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  FROM user_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;