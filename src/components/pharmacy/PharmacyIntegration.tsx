import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill, Truck, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PharmacyIntegrationProps {
  prescriptionId: string;
}

const PharmacyIntegration = ({ prescriptionId }: PharmacyIntegrationProps) => {
  const [loading, setLoading] = useState(false);
  const [pharmacyOrder, setPharmacyOrder] = useState<any>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const { toast } = useToast();

  const sendToPharmacy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-integration', {
        body: { 
          prescriptionId,
          pharmacyId: selectedPharmacy,
          deliveryOption
        }
      });

      if (error) throw error;

      setPharmacyOrder(data.pharmacyOrder);
      toast({
        title: "Prescription sent",
        description: "Your prescription has been sent to the pharmacy",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send prescription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Pharmacy Integration
        </CardTitle>
        <CardDescription>Send prescription to your preferred pharmacy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Pharmacy</label>
          <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a pharmacy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cvs">CVS Pharmacy</SelectItem>
              <SelectItem value="walgreens">Walgreens</SelectItem>
              <SelectItem value="walmart">Walmart Pharmacy</SelectItem>
              <SelectItem value="riteaid">Rite Aid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery Option</label>
          <Select value={deliveryOption} onValueChange={setDeliveryOption}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  In-Store Pickup
                </div>
              </SelectItem>
              <SelectItem value="delivery">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Home Delivery
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={sendToPharmacy} 
          disabled={loading || !selectedPharmacy}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send to Pharmacy'}
        </Button>

        {pharmacyOrder && (
          <div className="mt-4 p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">RX Number:</span>
              <span>{pharmacyOrder.rx_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status:</span>
              <span className="capitalize">{pharmacyOrder.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Ready By:</span>
              <span>{new Date(pharmacyOrder.estimated_ready).toLocaleString()}</span>
            </div>
            
            <div className="pt-2 border-t space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Medication Cost:</span>
                <span>${pharmacyOrder.cost_estimate.medication_cost}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Dispensing Fee:</span>
                <span>${pharmacyOrder.cost_estimate.dispensing_fee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Insurance Covers:</span>
                <span className="text-green-600">-${pharmacyOrder.cost_estimate.insurance_covered}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>You Pay:</span>
                <span>${pharmacyOrder.cost_estimate.patient_pays}</span>
              </div>
            </div>

            {pharmacyOrder.delivery && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  <Truck className="inline h-4 w-4 mr-1" />
                  Estimated delivery: {new Date(pharmacyOrder.delivery.estimated_delivery).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PharmacyIntegration;
