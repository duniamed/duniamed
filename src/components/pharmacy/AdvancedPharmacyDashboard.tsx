import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Pill, TrendingDown, AlertTriangle, Package } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdvancedPharmacyDashboard() {
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const { toast } = useToast();

  const handleOptimizeInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-inventory-optimization', {
        body: {
          clinicId: 'clinic-id',
          forecastDays: 30
        }
      });

      if (error) throw error;

      setOptimization(data.optimization);
      toast({
        title: "Optimization Complete",
        description: `Potential savings: $${data.optimization.cost_savings_potential || 0}`
      });
    } catch (error: any) {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Pharmacy Management</h2>
        </div>
        <Button onClick={handleOptimizeInventory} disabled={loading}>
          Optimize Inventory
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">247</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingDown className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Cost Savings</p>
              <p className="text-2xl font-bold">$3,450</p>
            </div>
          </div>
        </Card>
      </div>

      {optimization && (
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reorder Recommendations</h3>
            <div className="space-y-3">
              {optimization.reorder_items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Pill className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.medication}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {item.current_stock} | Recommended: {item.recommended_order}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'default' : 'outline'}>
                    {item.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Overstocked Items</h3>
            <div className="space-y-3">
              {optimization.overstocked_items?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">Reduce Order</Badge>
                  </div>
                  <Progress value={item.overstock_percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.overstock_percentage}% overstocked
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
