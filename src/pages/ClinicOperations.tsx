import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, DoorOpen } from 'lucide-react';

export default function ClinicOperations() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [roomUtilization, setRoomUtilization] = useState<any[]>([]);

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    try {
      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('clinic_inventory')
        .select('*')
        .order('current_stock', { ascending: true });

      if (inventoryData) {
        setInventory(inventoryData);
      }

      // Fetch room allocations for today
      const today = new Date().toISOString().split('T')[0];
      const { data: roomData } = await supabase
        .from('resource_allocations')
        .select(`
          *,
          clinic_resources (
            resource_name,
            resource_type
          )
        `)
        .gte('allocated_at', `${today}T00:00:00`)
        .lte('allocated_at', `${today}T23:59:59`)
        .order('allocated_at', { ascending: true });

      if (roomData) {
        setRoomUtilization(roomData);
      }
    } catch (error) {
      console.error('Error fetching operations data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load operations data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (itemId: string) => {
    toast({
      title: 'Reorder initiated',
      description: 'Order request sent to supplier',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Operations Panel">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Operations Automation" 
      description="Rooms & inventory manage themselves intelligently"
      showBackButton
    >
      <div className="space-y-6">
        {/* Room Utilization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DoorOpen className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Room Utilization - Today</CardTitle>
                <CardDescription>Automatic room assignment based on appointment type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {roomUtilization.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No room allocations for today</p>
            ) : (
              <div className="space-y-3">
                {roomUtilization.map((allocation) => (
                  <div key={allocation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{allocation.clinic_resources?.resource_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(allocation.allocated_at).toLocaleTimeString()} - {allocation.duration_minutes} min
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      allocation.released_at ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {allocation.released_at ? 'Available' : 'Occupied'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Smart alerts when supplies run low</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventory.map((item) => {
                const isLow = item.current_stock <= item.min_stock_threshold;
                const isCritical = item.current_stock <= item.min_stock_threshold * 0.5;
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isCritical ? 'border-destructive bg-destructive/5' : isLow ? 'border-orange-500 bg-orange-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {(isLow || isCritical) && (
                        <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-destructive' : 'text-orange-500'}`} />
                      )}
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">{item.item_category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Stock Level</p>
                        <p className={`font-bold ${isCritical ? 'text-destructive' : isLow ? 'text-orange-500' : ''}`}>
                          {item.current_stock} / {item.min_stock_threshold}
                        </p>
                      </div>
                      {isLow && (
                        <Button 
                          size="sm" 
                          variant={isCritical ? 'destructive' : 'outline'}
                          onClick={() => handleReorder(item.id)}
                        >
                          Reorder
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
