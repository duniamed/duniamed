import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, ShoppingCart, Search } from 'lucide-react';

interface InventoryItem {
  id: string;
  item_name: string;
  current_stock: number;
  min_stock_threshold: number;
  unit_cost: number;
  last_restocked: string;
}

export function InventoryManagementGrid() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_inventory')
        .select('*')
        .order('item_name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current: number, min: number) => {
    const percentage = (current / min) * 100;
    if (percentage <= 25) return { color: 'red', label: 'CRITICAL', variant: 'destructive' as const };
    if (percentage <= 50) return { color: 'orange', label: 'LOW', variant: 'default' as const };
    if (percentage <= 100) return { color: 'yellow', label: 'REORDER', variant: 'secondary' as const };
    return { color: 'green', label: 'GOOD', variant: 'outline' as const };
  };

  const handleReorder = (item: InventoryItem) => {
    const recommendedQuantity = Math.max(item.min_stock_threshold * 2 - item.current_stock, 0);
    toast({
      title: '🛒 Reorder Initiated',
      description: `Ordering ${recommendedQuantity} units of ${item.item_name} ($${(recommendedQuantity * item.unit_cost).toFixed(2)})`,
    });
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = items.filter(item => item.current_stock <= item.min_stock_threshold).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Management
            </CardTitle>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-500 font-semibold">
                  {lowStockCount} items need restocking
                </span>
              </div>
            )}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-4 pb-2 border-b font-semibold text-xs text-muted-foreground">
            <div>Item Name</div>
            <div className="text-center">Current Stock</div>
            <div className="text-center">Min Threshold</div>
            <div className="text-center">Status</div>
            <div className="text-right">Unit Cost</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Data Rows */}
          {filteredItems.map(item => {
            const status = getStockStatus(item.current_stock, item.min_stock_threshold);
            const needsReorder = item.current_stock <= item.min_stock_threshold;

            return (
              <div
                key={item.id}
                className={`grid grid-cols-6 gap-4 p-3 rounded-lg border ${
                  needsReorder ? 'bg-orange-500/5 border-orange-500/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {needsReorder && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  <span className="font-medium text-sm">{item.item_name}</span>
                </div>

                <div className="text-center">
                  <span className={`text-lg font-bold ${needsReorder ? 'text-orange-500' : ''}`}>
                    {item.current_stock}
                  </span>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {item.min_stock_threshold}
                </div>

                <div className="flex justify-center">
                  <Badge variant={status.variant} className="text-xs">
                    {status.label}
                  </Badge>
                </div>

                <div className="text-right text-sm font-medium">
                  ${item.unit_cost.toFixed(2)}
                </div>

                <div className="text-right">
                  {needsReorder && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(item)}
                      className="text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Reorder
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items found matching "{searchQuery}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
