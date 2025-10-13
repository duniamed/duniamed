import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, DoorOpen } from 'lucide-react';
import { RoomUtilizationHeatmap } from '@/components/clinic/RoomUtilizationHeatmap';
import { InventoryManagementGrid } from '@/components/clinic/InventoryManagementGrid';

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
        {/* Visual Room Utilization Heatmap */}
        <RoomUtilizationHeatmap />

        {/* Smart Inventory Management Grid */}
        <InventoryManagementGrid />
      </div>
    </DashboardLayout>
  );
}
