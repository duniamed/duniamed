# AI Governance Dashboard - Setup Guide

## What Has Been Built

I've created Phase 1 of your comprehensive AI Governance system:

### ✅ Database Schema (Complete)
- **ai_config_profiles**: Versioned AI configurations for different contexts (patient, clinic, specialist, internal)
- **ai_source_registry**: Approved medical sources with validation and staleness tracking
- **ai_policy_audit**: Immutable audit log of all configuration changes
- **ai_symptom_checker_modules**: Registry of AI modules and their storage locations
- **ai_symptom_logs**: Anonymized interaction logs for analytics
- **ai_sandbox_sessions**: Testing environment for configuration validation

### ✅ Admin UI (Complete)
- `/ai-governance` - Main dashboard with 6 tabs:
  1. **Configurations**: Create/manage AI behavior profiles (tone, compliance, abstain policy)
  2. **Sources**: Medical source registry with approval workflow
  3. **Modules**: View registered symptom checker modules
  4. **Sandbox**: Test configurations with synthetic data
  5. **Audit**: Immutable log of all changes
  6. **Analytics**: Interaction metrics and CSV exports

### ✅ Security (Complete)
- Admin-only access via RLS policies
- All tables protected with proper Row-Level Security
- Automatic audit logging via database triggers
- HIPAA/LGPD/GDPR compliance flags per configuration

## What You Need to Do Next

### Phase 2: Connect Your AI Logic (Required)

The infrastructure is ready, but you need to connect it to your actual AI:

#### Option 1: Use Lovable AI (Recommended - Easiest)
```typescript
// In your edge function (e.g., supabase/functions/ai-symptom-checker/index.ts)
import { createClient } from '@supabase/supabase-js';

// 1. Get active AI config for context
const { data: config } = await supabase
  .from('ai_config_profiles')
  .select('*')
  .eq('context', 'patient')
  .eq('is_active', true)
  .single();

// 2. Get approved sources
const { data: sources } = await supabase
  .from('ai_source_registry')
  .select('*')
  .eq('status', 'approved');

// 3. Build system prompt from config
const systemPrompt = `You are a ${config.responsiveness.tone} healthcare AI assistant.
Verbosity level: ${config.responsiveness.verbosity}.
Abstain policy: ${config.responsiveness.abstain_policy}.
Only use information from these approved sources: ${sources.map(s => s.name).join(', ')}.
If uncertain, ${config.responsiveness.abstain_policy === 'strict' ? 'abstain from answering' : 'escalate to human'}.`;

// 4. Call Lovable AI with config
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]
  })
});

const aiResult = await response.json();

// 5. Log the interaction
await supabase.from('ai_symptom_logs').insert({
  context: 'patient',
  inputs_hash: btoa(userInput),
  retrieved_sources: sources.map(s => ({ source_key: s.source_key, uri: s.uri })),
  output_summary: aiResult.choices[0].message.content,
  citations: sources, // Add actual citations from retrieval
  latency_ms: Date.now() - startTime
});
```

#### Option 2: External AI Provider (OpenAI, Anthropic, etc.)
Same pattern but replace Lovable AI with your provider's API.

#### Option 3: Custom ML Model
- Deploy your model separately
- Call it from edge functions
- Still use the config system for behavior control

### Phase 3: Connect to Medical Knowledge Sources

You'll need API integrations with:

1. **Clinical Guidelines** (PubMed, UpToDate, etc.)
   ```typescript
   // Add to ai_source_registry
   await supabase.from('ai_source_registry').insert({
     source_key: 'uptodate_2024',
     source_type: 'guideline',
     name: 'UpToDate Clinical Guidelines',
     uri: 'https://api.uptodate.com/v1',
     version: '2024.1',
     retrieval_method: 'api',
     status: 'approved'
   });
   ```

2. **Medical Ontologies** (ICD-10, SNOMED CT)
3. **Drug Databases** (FDA, formularies)
4. **Internal Protocols** (your organization's guidelines)

### Phase 4: Implement Retrieval-Augmented Generation (RAG)

For true medical AI, you need:

1. **Vector Database** (Supabase pgvector or Pinecone)
2. **Embeddings** (for semantic search)
3. **Citation Extraction** (link AI responses to specific guidelines)

Example with pgvector:
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embeddings to your knowledge base
CREATE TABLE medical_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES ai_source_registry(id),
  content TEXT,
  embedding vector(1536),
  metadata JSONB
);

-- Similarity search
CREATE INDEX ON medical_knowledge USING ivfflat (embedding vector_cosine_ops);
```

## Current Limitations & Solutions

### ❌ What's NOT Built Yet:
1. **No actual AI model integration** - You need to connect Lovable AI or other provider
2. **No medical knowledge base** - You need to add approved sources
3. **No retrieval logic** - You need to implement RAG (retrieval-augmented generation)
4. **No citation extraction** - You need to parse source references from AI responses

### ✅ Where to Build External AI:

If you want a SEPARATE proprietary AI (not using this platform):

1. **Train Your Own Model** (Advanced):
   - Use platforms like Hugging Face, AWS SageMaker, or Google Vertex AI
   - Fine-tune on medical data (LLaMA, Mistral, etc.)
   - Deploy as API endpoint
   - Call from your edge functions

2. **Use Healthcare AI APIs** (Easier):
   - **Glass Health**: AI for medical differential diagnosis
   - **Nabla Copilot**: Medical documentation AI
   - **Hippocratic AI**: Healthcare-specific LLM
   - **Your own RAG system** with approved medical sources

3. **Hybrid Approach** (Recommended):
   - Use Lovable AI for general queries
   - Route medical questions to specialized providers
   - Always enforce your config and source restrictions

## Integration Example

Here's how to connect everything:

```typescript
// supabase/functions/intelligent-symptom-checker/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js@2';

serve(async (req) => {
  const { symptoms, context } = await req.json();
  const supabase = createClient(/* ... */);

  // 1. Load active config
  const { data: config } = await supabase
    .from('ai_config_profiles')
    .select('*')
    .eq('context', context)
    .eq('is_active', true)
    .single();

  // 2. Get approved sources
  const { data: sources } = await supabase
    .from('ai_source_registry')
    .select('*')
    .eq('status', 'approved')
    .gte('valid_to', new Date().toISOString());

  // 3. Retrieve relevant medical knowledge (RAG)
  const relevantKnowledge = await retrieveFromSources(symptoms, sources);

  // 4. Build context-aware prompt
  const systemPrompt = buildPrompt(config, relevantKnowledge);

  // 5. Call AI with restrictions
  const aiResponse = await callAI(systemPrompt, symptoms);

  // 6. Log interaction (anonymized)
  await supabase.from('ai_symptom_logs').insert({
    context,
    inputs_hash: hashInput(symptoms),
    retrieved_sources: relevantKnowledge,
    output_summary: aiResponse.summary,
    citations: extractCitations(aiResponse),
    latency_ms: aiResponse.latency
  });

  return new Response(JSON.stringify(aiResponse));
});
```

## Next Steps Summary

1. ✅ **Done**: Database, UI, audit trails, security
2. ⏳ **Next**: Connect AI provider (Lovable AI recommended)
3. ⏳ **Then**: Add medical knowledge sources (APIs, databases)
4. ⏳ **Finally**: Implement RAG for evidence-based responses

## Access

Navigate to `/ai-governance` as an admin user to start configuring AI behavior.

## Questions?

**Q: Can I use this without building my own AI?**
A: Yes! Use Lovable AI with the config system to control behavior and compliance.

**Q: Do I need medical APIs?**
A: For production medical AI, yes. For testing, you can use public medical resources initially.

**Q: How do I make AI cite sources?**
A: Implement RAG (retrieval) and instruct the AI to include source references in responses. Log these in `ai_symptom_logs.citations`.

**Q: Where should I train my AI model?**
A: Don't train from scratch. Use Lovable AI or fine-tune existing medical LLMs on platforms like Hugging Face or AWS.
