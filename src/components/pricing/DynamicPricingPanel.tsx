import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function DynamicPricingPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [pricing, setPricing] = useState<any>(null);

  const serviceTypes = [
    'General Consultation',
    'Specialist Visit',
    'Follow-up',
    'Emergency',
    'Procedure'
  ];

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dynamic-pricing-optimizer', {
        body: {
          service_type: serviceType,
          time_slot: new Date().toISOString(),
          specialist_id: 'spec-123'
        }
      });

      if (error) throw error;

      setPricing(data.pricing);
      toast({
        title: "Pricing Optimized",
        description: `Optimal price: $${data.pricing.optimal_price}`,
      });
    } catch (error: any) {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Dynamic Pricing Optimizer</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Service Type</label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleOptimize} disabled={loading || !serviceType}>
            Optimize Pricing
          </Button>
        </div>
      </Card>

      {pricing && (
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Optimal Price</p>
            <p className="text-4xl font-bold text-primary">
              ${pricing.optimal_price}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary rounded">
              <p className="text-xs text-muted-foreground">Min Price</p>
              <p className="text-xl font-semibold">${pricing.price_range?.min}</p>
            </div>
            <div className="p-3 bg-secondary rounded">
              <p className="text-xs text-muted-foreground">Max Price</p>
              <p className="text-xl font-semibold">${pricing.price_range?.max}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Demand Level</span>
              <Badge>{Math.round(pricing.demand_factor * 100)}%</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Surge Multiplier</span>
              <Badge variant={pricing.surge_multiplier > 1 ? "destructive" : "default"}>
                {pricing.surge_multiplier}x
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Booking Probability</span>
              <Badge variant="outline">
                {Math.round(pricing.booking_probability * 100)}%
              </Badge>
            </div>
          </div>

          {pricing.revenue_impact && (
            <div className="p-3 bg-secondary rounded flex items-center gap-2">
              {pricing.revenue_impact > 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">Revenue Impact</p>
                <p className="text-xs text-muted-foreground">{pricing.revenue_impact}</p>
              </div>
            </div>
          )}

          {pricing.competitor_analysis && (
            <div className="p-3 border rounded">
              <h5 className="text-sm font-medium mb-2">Market Analysis</h5>
              <p className="text-xs text-muted-foreground">{pricing.competitor_analysis}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
