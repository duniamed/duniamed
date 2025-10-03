import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { toast } from 'sonner';
import { CreditCard, FileText, DollarSign, Download, AlertCircle } from 'lucide-react';

/**
 * C24 PAYMENTS - Payment Processing & Invoicing
 * Patients pay at booking, see refund rules, receive receipts
 * Specialists tie invoices to visits, get balance alerts
 * Clinics operate refund consoles, appointment-linked billing
 */

function PaymentProcessingContent() {
  const { user } = useAuth();
  const [paymentIntents, setPaymentIntents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load payment intents
    const { data: paymentsData } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    setPaymentIntents(paymentsData || []);

    // Load invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    setInvoices(invoicesData || []);

    // Load refunds
    const { data: refundsData } = await supabase
      .from('refunds')
      .select(`
        *,
        payment_intent:payment_intents(*)
      `)
      .eq('requested_by', user.id)
      .order('created_at', { ascending: false });

    setRefunds(refundsData || []);
    setLoading(false);
  };

  const requestRefund = async (paymentIntentId: string) => {
    const { error } = await supabase
      .from('refunds')
      .insert({
        payment_intent_id: paymentIntentId,
        refund_amount: 0, // Will be calculated by backend
        refund_reason: 'Patient requested refund',
        refund_policy_applied: '24_hour_policy',
        requested_by: user?.id,
        status: 'pending'
      });

    if (error) {
      console.error('Error requesting refund:', error);
      toast.error('Failed to request refund');
    } else {
      toast.success('Refund request submitted. You will receive an update within 24 hours.');
      loadData();
    }
  };

  const downloadInvoice = (invoice: any) => {
    toast.success('Invoice download started');
    // In production, this would download the actual PDF
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPaid = paymentIntents
    .filter((p: any) => p.status === 'succeeded')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const totalRefunded = refunds
    .filter((r: any) => r.status === 'processed')
    .reduce((sum: number, r: any) => sum + parseFloat(r.refund_amount), 0);

  return (
    <DashboardLayout title="Payments & Billing" description="Manage your payments and invoices">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Paid</span>
              <InfoTooltip content="Total amount you've paid for healthcare services" />
            </div>
            <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Invoices</span>
              <InfoTooltip content="Number of invoices issued to you" />
            </div>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Refunds</span>
              <InfoTooltip content="Total amount refunded to you" />
            </div>
            <p className="text-2xl font-bold">${totalRefunded.toFixed(2)}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Payment History</h2>
            <InfoTooltip content="All your payment transactions. You can request refunds within 24 hours of payment for eligible services." />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading payments...</div>
          ) : paymentIntents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentIntents.map((payment: any) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">${parseFloat(payment.amount).toFixed(2)} {payment.currency}</span>
                        <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        {payment.refund_eligibility && (
                          <Badge variant="outline">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {payment.refund_eligibility}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()} • 
                        {payment.payment_method && ` via ${payment.payment_method}`}
                      </p>
                    </div>
                    {payment.status === 'succeeded' && payment.refund_eligibility === 'eligible' && (
                      <Button variant="outline" size="sm" onClick={() => requestRefund(payment.id)}>
                        Request Refund
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold">Invoices</h2>
            <InfoTooltip content="Detailed invoices for all your healthcare services. Click download to save a copy." />
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice: any) => (
                <Card key={invoice.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{invoice.invoice_number}</span>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: ${parseFloat(invoice.total).toFixed(2)} • 
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => downloadInvoice(invoice)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {refunds.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold">Refund Requests</h2>
              <InfoTooltip content="Track the status of your refund requests. Refunds are typically processed within 5-7 business days." />
            </div>

            <div className="space-y-3">
              {refunds.map((refund: any) => (
                <Card key={refund.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">${parseFloat(refund.refund_amount).toFixed(2)}</span>
                        <Badge className={getStatusColor(refund.status)}>{refund.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reason: {refund.refund_reason} • 
                        Requested: {new Date(refund.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function PaymentProcessing() {
  return (
    <ProtectedRoute>
      <PaymentProcessingContent />
    </ProtectedRoute>
  );
}
