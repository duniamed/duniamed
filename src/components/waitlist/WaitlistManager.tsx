import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, Check } from 'lucide-react';

export const WaitlistManager: React.FC = () => {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWaitlist();
    const interval = setInterval(loadWaitlist, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadWaitlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!specialist) return;

      const { data } = await supabase
        .from('appointment_waitlist')
        .select(`
          *,
          profiles:patient_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('specialist_id', specialist.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });

      setWaitlist(data || []);
    } catch (error) {
      console.error('Load waitlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIMatching = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-match-waitlist', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "AI Matching Complete",
        description: `${data.matches?.length || 0} patients matched to available slots`,
      });

      loadWaitlist();
    } catch (error: any) {
      toast({
        title: "Matching Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Waitlist Management</CardTitle>
          <Button onClick={runAIMatching}>
            <Check className="mr-2 h-4 w-4" />
            Run AI Matching
          </Button>
        </CardHeader>
        <CardContent>
          {waitlist.length > 0 ? (
            <div className="space-y-3">
              {waitlist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {entry.profiles?.first_name} {entry.profiles?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.notes}
                    </div>
                    {entry.preferred_date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Prefers: {new Date(entry.preferred_date).toLocaleDateString()}
                        {entry.preferred_time_slot && ` at ${entry.preferred_time_slot}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {Math.floor((Date.now() - new Date(entry.created_at).getTime()) / (1000 * 60 * 60))}h waiting
                    </Badge>
                    <Badge>{entry.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No patients in waitlist</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
