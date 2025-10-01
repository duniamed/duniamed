import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate basic metrics
    const income = transactions
      .filter((t: any) => t.transaction_type === 'income' || t.transaction_type === 'payment')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter((t: any) => t.transaction_type === 'expense' || t.transaction_type === 'refund')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    // Prepare data for AI analysis
    const transactionSummary = {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      transactionCount: transactions.length,
      categories: [...new Set(transactions.map((t: any) => t.category).filter(Boolean))],
      recentTransactions: transactions.slice(0, 10).map((t: any) => ({
        type: t.transaction_type,
        amount: t.amount,
        category: t.category,
        date: t.transaction_date,
      })),
    };

    // Call Lovable AI for insights
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor AI analyzing healthcare business transactions. Provide actionable insights, identify trends, and suggest optimizations. Be concise and practical.',
          },
          {
            role: 'user',
            content: `Analyze this financial data and provide 3-5 key recommendations:\n\n${JSON.stringify(transactionSummary, null, 2)}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error('Failed to get AI insights');
    }

    const aiData = await aiResponse.json();
    const aiRecommendations = aiData.choices[0].message.content;

    // Parse AI recommendations into structured format
    const recommendations = aiRecommendations
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^[\d\.\-\*]\s*/, '').trim())
      .filter((line: string) => line.length > 10)
      .slice(0, 5);

    // Calculate category breakdown
    const categoryMap = new Map();
    transactions.forEach((t: any) => {
      if (t.category) {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + parseFloat(t.amount));
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount: amount as number }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const insights = {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      trend: income > expenses ? 'up' : 'down',
      recommendations: recommendations.length > 0 ? recommendations : [
        'Continue tracking all transactions for better insights',
        'Review high-expense categories for potential savings',
        'Consider setting monthly budget targets',
      ],
      monthlyBreakdown: [],
      topCategories,
    };

    console.log('Financial analysis complete:', insights);

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Financial analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
