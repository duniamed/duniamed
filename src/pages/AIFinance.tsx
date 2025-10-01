import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialInsights {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  trend: 'up' | 'down';
  recommendations: string[];
  monthlyBreakdown: {
    month: string;
    income: number;
    expenses: number;
  }[];
  topCategories: {
    category: string;
    amount: number;
  }[];
}

export default function AIFinance() {
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (transactions && transactions.length > 0) {
        await analyzeFinancialData(transactions);
      } else {
        setInsights({
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          trend: 'up',
          recommendations: ['Start tracking your financial transactions to get AI-powered insights'],
          monthlyBreakdown: [],
          topCategories: [],
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error loading financial data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeFinancialData = async (transactions: any[]) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-financial-analysis', {
        body: { transactions },
      });

      if (error) throw error;
      setInsights(data.insights);
    } catch (error: any) {
      toast({
        title: 'AI Analysis Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Financial Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Get AI-powered insights into your financial health
          </p>
        </div>

        {insights && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${insights.totalIncome.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${insights.totalExpenses.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  {insights.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${insights.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${insights.netProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                </div>
                <CardDescription>
                  Personalized insights to optimize your financial health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Top Categories */}
            {insights.topCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <CardTitle>Top Spending Categories</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.topCategories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.category}</span>
                        <span className="text-sm font-bold">${cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center">
              <Button
                onClick={() => loadFinancialData()}
                disabled={analyzing}
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Refresh AI Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
