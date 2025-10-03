import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';

export default function CostEstimator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [formData, setFormData] = useState({
    service_codes: [] as string[],
    insurance_plan: '',
  });
  const [serviceCode, setServiceCode] = useState('');

  const addServiceCode = () => {
    if (serviceCode && !formData.service_codes.includes(serviceCode)) {
      setFormData({ ...formData, service_codes: [...formData.service_codes, serviceCode] });
      setServiceCode('');
    }
  };

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('cost_estimates')
        .insert({
          patient_id: user?.id,
          service_codes: formData.service_codes,
          insurance_plan: formData.insurance_plan || null,
          estimated_total: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const totalEstimate = formData.service_codes.length * 75;
      const insurancePayment = formData.insurance_plan ? totalEstimate * 0.7 : 0;
      const patientResponsibility = totalEstimate - insurancePayment;

      setEstimate({
        ...data,
        estimated_total: totalEstimate,
        estimated_insurance_payment: insurancePayment,
        estimated_patient_responsibility: patientResponsibility,
      });
      
      toast({
        title: 'Estimate Generated',
        description: `Total estimated cost: $${totalEstimate}`,
      });
    } catch (error: any) {
      console.error('Estimation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate estimate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const lockPrice = async () => {
    if (!estimate) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('lock-cost-estimate', {
        body: { 
          estimate_id: estimate.id, 
          lock_duration_minutes: 30 
        }
      });

      if (error) throw error;

      if (data?.success) {
        const updatedEstimate = {
          ...estimate,
          is_locked: true,
          lock_expires_at: data.expires_at,
          locked_amount: data.locked_amount
        };
        setEstimate(updatedEstimate);
        
        toast({
          title: 'Price Locked ✓',
          description: `Price of $${data.locked_amount} locked for ${data.minutes_remaining} minutes`,
        });
      } else {
        throw new Error(data?.error || 'Failed to lock price');
      }
    } catch (error: any) {
      console.error('Price lock error:', error);
      toast({
        title: 'Failed to lock price',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Cost Estimator</h1>
            <p className="text-muted-foreground">Estimate your out-of-pocket costs before booking</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEstimate} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Codes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 99213"
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                  />
                  <Button type="button" onClick={addServiceCode}>Add</Button>
                </div>
                {formData.service_codes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.service_codes.map((code) => (
                      <span key={code} className="bg-muted px-3 py-1 rounded text-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="insurance_plan">Insurance Plan (Optional)</Label>
                <Input
                  id="insurance_plan"
                  placeholder="Your insurance plan name"
                  value={formData.insurance_plan}
                  onChange={(e) => setFormData({ ...formData, insurance_plan: e.target.value })}
                />
              </div>
              
              <Button type="submit" disabled={loading || formData.service_codes.length === 0} className="w-full">
                {loading ? 'Calculating...' : 'Get Estimate'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {estimate && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Estimated Cost</span>
                  <span className="text-2xl font-bold">${estimate.estimated_total}</span>
                </div>
                {estimate.insurance_plan && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Insurance Payment</span>
                      <span className="text-lg text-green-600">${estimate.estimated_insurance_payment}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-medium">Your Responsibility</span>
                      <span className="text-2xl font-bold text-primary">${estimate.estimated_patient_responsibility}</span>
                    </div>
                  </>
                )}
                
                {!estimate.is_locked ? (
                  <div className="pt-4 border-t">
                    <Button onClick={lockPrice} className="w-full">
                      🔒 Lock This Price for 24 Hours
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Lock your price now to guarantee this rate when booking
                    </p>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-800 mb-1">
                        ✓ Price Locked!
                      </p>
                      <p className="text-xs text-green-700">
                        This price is guaranteed until{' '}
                        {new Date(estimate.lock_expires_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
