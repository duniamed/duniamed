import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { query, sources = ['pubmed', 'icd10'], maxResults = 5 } = await req.json();

    const results: any = {
      query,
      sources: {},
      timestamp: new Date().toISOString(),
    };

    // Search PubMed (using free E-utilities API)
    if (sources.includes('pubmed')) {
      try {
        const pubmedSearch = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`
        );
        
        if (pubmedSearch.ok) {
          const pubmedData = await pubmedSearch.json();
          const ids = pubmedData.esearchresult?.idlist || [];
          
          if (ids.length > 0) {
            const summaryResp = await fetch(
              `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
            );
            
            if (summaryResp.ok) {
              const summaryData = await summaryResp.json();
              results.sources.pubmed = {
                count: ids.length,
                articles: ids.map((id: string) => ({
                  pmid: id,
                  title: summaryData.result?.[id]?.title || 'N/A',
                  authors: summaryData.result?.[id]?.authors?.map((a: any) => a.name).join(', ') || 'N/A',
                  source: summaryData.result?.[id]?.source || 'N/A',
                  pubdate: summaryData.result?.[id]?.pubdate || 'N/A',
                  url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                })),
              };
            }
          }
        }
      } catch (error) {
        console.error('PubMed search error:', error);
        results.sources.pubmed = { error: 'Search failed' };
      }
    }

    // Search ICD-10 (using free ClinicalTables API)
    if (sources.includes('icd10')) {
      try {
        const icd10Search = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=${maxResults}`
        );
        
        if (icd10Search.ok) {
          const icd10Data = await icd10Search.json();
          results.sources.icd10 = {
            count: icd10Data[1]?.length || 0,
            codes: icd10Data[3]?.map((item: any, idx: number) => ({
              code: item[0],
              name: item[1],
              display: icd10Data[1][idx],
            })) || [],
          };
        }
      } catch (error) {
        console.error('ICD-10 search error:', error);
        results.sources.icd10 = { error: 'Search failed' };
      }
    }

    // Log the search
    await supabase.from('ai_symptom_logs').insert({
      context: 'knowledge_search',
      inputs_hash: query.substring(0, 100),
      output_summary: JSON.stringify(results).substring(0, 200),
      citations: [],
      retrieved_sources: sources,
      flags: { query_type: 'medical_knowledge' },
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
