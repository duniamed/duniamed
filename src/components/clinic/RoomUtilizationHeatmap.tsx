import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';

interface RoomUtilization {
  room_id: string;
  room_name: string;
  hourly_utilization: { [hour: string]: number };
}

export function RoomUtilizationHeatmap() {
  const [utilization, setUtilization] = useState<RoomUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUtilization();
  }, []);

  const fetchUtilization = async () => {
    try {
      // Fetch rooms and their appointments for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: allocations } = await supabase
        .from('resource_allocations')
        .select(`
          *,
          resource:clinic_resources(id, name),
          appointment:appointments(scheduled_at, duration_minutes)
        `)
        .gte('allocated_at', today.toISOString())
        .lt('allocated_at', tomorrow.toISOString());

      // Process into hourly utilization
      const roomMap = new Map<string, RoomUtilization>();
      
      allocations?.forEach((alloc: any) => {
        if (!alloc.resource || !alloc.appointment) return;
        
        const roomId = alloc.resource.id;
        const roomName = alloc.resource.name;
        const startTime = new Date(alloc.appointment.scheduled_at);
        const duration = alloc.duration_minutes || 30;

        if (!roomMap.has(roomId)) {
          roomMap.set(roomId, {
            room_id: roomId,
            room_name: roomName,
            hourly_utilization: {}
          });
        }

        const room = roomMap.get(roomId)!;
        const hour = startTime.getHours();
        room.hourly_utilization[hour] = (room.hourly_utilization[hour] || 0) + duration;
      });

      setUtilization(Array.from(roomMap.values()));
    } catch (error) {
      console.error('Error fetching utilization:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100';
    if (minutes <= 30) return 'bg-green-200';
    if (minutes <= 45) return 'bg-yellow-200';
    if (minutes <= 60) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Room Utilization Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">Hourly occupancy - Green=Available, Red=Overbooked</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-semibold">Room</th>
                {hours.map(hour => (
                  <th key={hour} className="p-2 text-center text-xs font-semibold">
                    {hour}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utilization.map(room => (
                <tr key={room.room_id} className="border-t">
                  <td className="p-2 text-sm font-medium">{room.room_name}</td>
                  {hours.map(hour => {
                    const minutes = room.hourly_utilization[hour] || 0;
                    return (
                      <td key={hour} className="p-1">
                        <div
                          className={`h-8 rounded ${getHeatColor(minutes)} flex items-center justify-center text-xs font-semibold`}
                          title={`${minutes} minutes used`}
                        >
                          {minutes > 0 && `${minutes}m`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="font-semibold">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>&lt;30min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span>30-45min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-200 rounded"></div>
            <span>45-60min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span>&gt;60min (Overbooked)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
