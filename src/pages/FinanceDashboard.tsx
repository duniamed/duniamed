import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  account_type: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  category: string;
  description: string;
  created_at: string;
}

export default function FinanceDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Fetch transactions
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (timeFilter !== 'all') {
        const days = timeFilter === '7d' ? 7 : 30;
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte('created_at', date.toISOString());
      }

      const { data: transactionsData, error: transactionsError } = await query;
      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Prepare chart data
      prepareChartData(transactionsData || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load financial data',
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (txns: Transaction[]) => {
    const grouped = txns.reduce((acc: any, txn) => {
      const date = new Date(txn.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, income: 0, expenses: 0 };
      }
      if (txn.transaction_type === 'credit') {
        acc[date].income += parseFloat(txn.amount.toString());
      } else {
        acc[date].expenses += parseFloat(txn.amount.toString());
      }
      return acc;
    }, {});

    setChartData(Object.values(grouped).reverse());
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance.toString()), 0);
  const totalIncome = transactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpenses = transactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={timeFilter === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeFilter === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 backdrop-blur-md bg-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h3 className="text-2xl font-bold mt-1">${totalBalance.toFixed(2)}</h3>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-md bg-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">${totalIncome.toFixed(2)}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-md bg-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <h3 className="text-2xl font-bold mt-1 text-red-600">${totalExpenses.toFixed(2)}</h3>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="p-6 backdrop-blur-md bg-card/50">
        <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Accounts and Transactions */}
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4 backdrop-blur-md bg-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{account.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{account.account_type}</p>
                </div>
                <p className="text-xl font-bold">
                  {account.currency} {parseFloat(account.balance.toString()).toFixed(2)}
                </p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-2">
          {transactions.map((txn) => (
            <Card key={txn.id} className="p-4 backdrop-blur-md bg-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{txn.description || txn.category}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    txn.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {txn.transaction_type === 'credit' ? '+' : '-'}$
                  {parseFloat(txn.amount.toString()).toFixed(2)}
                </p>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
