import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, TrendingUp, TrendingDown, AlertCircle, DollarSign, ShoppingCart } from 'lucide-react';

export const PharmacyOptimizationDashboard = () => {
  const [optimization, setOptimization] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const runOptimization = async () => {
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-inventory-optimization', {
        body: { clinicId: 'clinic-id' }
      });

      if (error) throw error;

      setOptimization(data.optimization);
      toast({
        title: 'Optimization complete',
        description: `Analyzed ${data.inventory_count} items with ${data.prescriptions_analyzed} prescriptions`
      });
    } catch (error: any) {
      toast({
        title: 'Optimization failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: any = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'default'
    };
    return <Badge variant={variants[urgency] || 'default'}>{urgency}</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pharmacy Inventory Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runOptimization} disabled={isOptimizing}>
            {isOptimizing ? 'Optimizing...' : 'Run ML Optimization'}
          </Button>

          {optimization && (
            <div className="mt-6 space-y-6">
              {/* Cost Optimization Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm font-medium">Potential Savings</span>
                    </div>
                    <p className="text-2xl font-bold">${optimization.cost_optimization?.potential_savings.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Package className="h-5 w-5" />
                      <span className="text-sm font-medium">Waste Reduction</span>
                    </div>
                    <p className="text-2xl font-bold">{optimization.cost_optimization?.waste_reduction}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-medium">Turnover Improvement</span>
                    </div>
                    <p className="text-2xl font-bold">{optimization.cost_optimization?.turnover_improvement}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Insights */}
              {optimization.inventory_insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inventory Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optimization.inventory_insights.overstocked_items?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Overstocked Items
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {optimization.inventory_insights.overstocked_items.map((item: string, i: number) => (
                            <Badge key={i} variant="secondary">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {optimization.inventory_insights.understocked_items?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Understocked Items
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {optimization.inventory_insights.understocked_items.map((item: string, i: number) => (
                            <Badge key={i} variant="destructive">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {optimization.inventory_insights.fast_moving?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Fast-Moving Items
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {optimization.inventory_insights.fast_moving.map((item: string, i: number) => (
                            <Badge key={i} variant="default">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Optimization Recommendations
                </h3>
                {optimization.optimization_recommendations?.map((rec: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{rec.medication_name}</h4>
                          <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                        </div>
                        {getUrgencyBadge(rec.urgency)}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Stock</p>
                          <p className="text-lg font-semibold">{rec.current_stock}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Recommended Stock</p>
                          <p className="text-lg font-semibold text-green-600">{rec.recommended_stock}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Order Quantity</p>
                          <p className="text-lg font-semibold text-blue-600">{rec.order_quantity}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Reorder Point</span>
                            <span className="font-medium">{rec.reorder_point}</span>
                          </div>
                          <Progress value={(rec.current_stock / rec.reorder_point) * 100} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm pt-2">
                          <div>
                            <p className="text-muted-foreground">Next Week</p>
                            <p className="font-medium">{rec.predicted_demand?.next_week}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Month</p>
                            <p className="font-medium">{rec.predicted_demand?.next_month}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost Impact</p>
                            <p className="font-medium text-green-600">${rec.cost_impact}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Demand Patterns */}
              {optimization.demand_patterns?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Demand Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimization.demand_patterns.map((pattern: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTrendIcon(pattern.trend)}
                            <div>
                              <p className="font-medium">{pattern.medication}</p>
                              <p className="text-sm text-muted-foreground capitalize">{pattern.trend}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Growth Rate</p>
                            <p className="font-medium">{(pattern.growth_rate * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
