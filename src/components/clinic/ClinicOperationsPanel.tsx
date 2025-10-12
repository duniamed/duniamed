import { useState, useEffect } from 'react';
import { Calendar, Package, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClinicOperationsPanelProps {
  clinicId: string;
}

export function ClinicOperationsPanel({ clinicId }: ClinicOperationsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadOperationsData();
  }, [clinicId]);

  const loadOperationsData = async () => {
    setIsLoading(true);
    try {
      const [resourcesRes, inventoryRes, allocationsRes] = await Promise.all([
        supabase.from('clinic_resources').select('*').eq('clinic_id', clinicId),
        supabase.from('clinic_inventory').select('*').eq('clinic_id', clinicId),
        supabase
          .from('resource_allocations')
          .select('*, appointments(*), clinic_resources(*)')
          .in('resource_id', resources.map(r => r.id))
          .gte('allocated_at', new Date().toISOString())
          .order('allocated_at')
      ]);

      if (resourcesRes.data) setResources(resourcesRes.data);
      if (inventoryRes.data) setInventory(inventoryRes.data);
      if (allocationsRes.data) setAllocations(allocationsRes.data);
    } catch (error: any) {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockItems = inventory.filter(item => 
    item.current_stock <= item.min_stock_threshold
  );

  const roomUtilization = resources
    .filter(r => r.resource_type === 'room')
    .map(room => {
      const todayAllocations = allocations.filter(
        a => a.resource_id === room.id && 
        new Date(a.allocated_at).toDateString() === new Date().toDateString()
      );
      const totalMinutes = todayAllocations.reduce((sum, a) => sum + a.duration_minutes, 0);
      return {
        ...room,
        utilizationPercent: Math.min((totalMinutes / (8 * 60)) * 100, 100)
      };
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Operations Dashboard</h2>
        <Button onClick={loadOperationsData}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Alert Cards */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="font-medium">{item.item_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {item.current_stock} remaining
                    </Badge>
                    <Button size="sm" variant="outline">
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="resources">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomUtilization.map(room => (
                  <div key={room.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.resource_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {room.utilizationPercent.toFixed(0)}% utilized
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${room.utilizationPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.item_category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{item.current_stock}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.min_stock_threshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allocations
                  .filter(a => new Date(a.allocated_at).toDateString() === new Date().toDateString())
                  .map(allocation => (
                    <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{allocation.clinic_resources.resource_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(allocation.allocated_at).toLocaleTimeString()} - {allocation.duration_minutes} min
                        </p>
                      </div>
                      <Badge>{allocation.appointments.status}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}