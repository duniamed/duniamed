import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Pill, Clock, CheckCircle2 } from 'lucide-react';

export const MedicationTracker: React.FC = () => {
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['approved', 'dispensed'])
        .order('created_at', { ascending: false });

      setMedications(data || []);
    } catch (error) {
      console.error('Load medications error:', error);
    }
  };

  const markAsTaken = async (prescriptionId: string) => {
    try {
      // Log medication taken (placeholder - would use adherence table)
      console.log('Medication taken:', prescriptionId);
      loadMedications();
    } catch (error) {
      console.error('Mark as taken error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medication Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {medications.length > 0 ? (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{med.medication_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {med.dosage} - {med.frequency}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Next dose: {med.next_dose_time || 'Not set'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={med.status === 'active' ? 'default' : 'secondary'}>
                    {med.status}
                  </Badge>
                  <Checkbox
                    onCheckedChange={() => markAsTaken(med.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No active medications
          </div>
        )}
      </CardContent>
    </Card>
  );
};
