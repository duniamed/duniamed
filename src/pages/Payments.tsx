import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  appointment_id: string;
  appointments: {
    scheduled_at: string;
    specialists: {
      profiles: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export default function Payments() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <PaymentsContent />
    </ProtectedRoute>
  );
}

function PaymentsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointments (
          scheduled_at,
          specialists (
            profiles:user_id (
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('payer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data as any);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'refunded':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const filterPayments = (status: 'completed' | 'pending' | 'all') => {
    if (status === 'all') return payments;
    return payments.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const PaymentCard = ({ payment }: { payment: Payment }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {payment.currency} {payment.amount.toFixed(2)}
              </CardTitle>
              <CardDescription>
                Dr. {payment.appointments.specialists.profiles.first_name}{' '}
                {payment.appointments.specialists.profiles.last_name}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(payment.status)}>
            {payment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Appointment: {new Date(payment.appointments.scheduled_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>
              Paid on: {new Date(payment.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16">
        <h1 className="text-3xl font-bold mb-6">Payment History</h1>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {payments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payment history</p>
                </CardContent>
              </Card>
            ) : (
              payments.map(payment => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterPayments('completed').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed payments</p>
                </CardContent>
              </Card>
            ) : (
              filterPayments('completed').map(payment => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterPayments('pending').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending payments</p>
                </CardContent>
              </Card>
            ) : (
              filterPayments('pending').map(payment => (
                <PaymentCard key={payment.id} payment={payment} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
