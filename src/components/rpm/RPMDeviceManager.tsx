import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface RPMDeviceManagerProps {
  patientId: string;
}

export const RPMDeviceManager: React.FC<RPMDeviceManagerProps> = ({ patientId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_type: 'blood_pressure',
    device_id: '',
    manufacturer: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices } = useQuery({
    queryKey: ['rpm-devices', patientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('rpm_devices')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true);
      return data || [];
    }
  });

  const addDeviceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('rpm_devices')
        .insert({
          patient_id: patientId,
          device_type: newDevice.device_type,
          device_id: newDevice.device_id,
          manufacturer: newDevice.manufacturer,
          is_active: true,
          last_sync_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Device Added",
        description: "RPM device successfully connected",
      });
      queryClient.invalidateQueries({ queryKey: ['rpm-devices', patientId] });
      setShowAddForm(false);
      setNewDevice({ device_type: 'blood_pressure', device_id: '', manufacturer: '' });
    }
  });

  const syncDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-rpm-devices', {
        body: {
          action: 'sync',
          deviceId,
          patientId
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Device Synced",
        description: "Latest readings retrieved from device",
      });
      queryClient.invalidateQueries({ queryKey: ['rpm-devices', patientId] });
    }
  });

  const removeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from('rpm_devices')
        .update({ is_active: false })
        .eq('id', deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Device Removed",
        description: "RPM device has been disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ['rpm-devices', patientId] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            RPM Device Manager
          </CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showAddForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <Select
              value={newDevice.device_type}
              onValueChange={(value) => setNewDevice({ ...newDevice, device_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood_pressure">Blood Pressure Monitor</SelectItem>
                <SelectItem value="glucose">Glucose Meter</SelectItem>
                <SelectItem value="weight">Weight Scale</SelectItem>
                <SelectItem value="heart_rate">Heart Rate Monitor</SelectItem>
                <SelectItem value="oximeter">Pulse Oximeter</SelectItem>
                <SelectItem value="thermometer">Thermometer</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Device ID / Serial Number"
              value={newDevice.device_id}
              onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
            />
            <Input
              placeholder="Manufacturer"
              value={newDevice.manufacturer}
              onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
            />
            <Button
              onClick={() => addDeviceMutation.mutate()}
              disabled={!newDevice.device_id || addDeviceMutation.isPending}
              className="w-full"
            >
              Connect Device
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {devices?.map((device: any) => (
            <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {device.device_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
                <p className="text-sm text-muted-foreground">
                  {device.manufacturer} • ID: {device.device_id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last sync: {new Date(device.last_sync_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncDeviceMutation.mutate(device.id)}
                  disabled={syncDeviceMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDeviceMutation.mutate(device.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {(!devices || devices.length === 0) && !showAddForm && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No RPM devices connected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
