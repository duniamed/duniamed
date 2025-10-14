import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Thermometer, Weight } from 'lucide-react';

interface RPMDeviceCardProps {
  device: {
    device_type: string;
    device_name: string;
    last_sync: string;
    is_active: boolean;
  };
  latestReading?: {
    value: number;
    unit: string;
    is_flagged: boolean;
  };
}

const getDeviceIcon = (type: string) => {
  switch (type) {
    case 'blood_pressure': return Heart;
    case 'glucose': return Activity;
    case 'temperature': return Thermometer;
    case 'weight': return Weight;
    default: return Activity;
  }
};

export const RPMDeviceCard: React.FC<RPMDeviceCardProps> = ({ device, latestReading }) => {
  const Icon = getDeviceIcon(device.device_type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {device.device_name}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {latestReading ? (
          <>
            <div className="text-2xl font-bold">
              {latestReading.value} {latestReading.unit}
            </div>
            {latestReading.is_flagged && (
              <Badge variant="destructive" className="mt-2">Alert</Badge>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">No data</div>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          Last sync: {new Date(device.last_sync).toLocaleString()}
        </div>
        <Badge variant={device.is_active ? "default" : "secondary"} className="mt-2">
          {device.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </CardContent>
    </Card>
  );
};
