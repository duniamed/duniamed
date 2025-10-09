import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AISymptomChecker() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe your symptoms',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-checker', {
        body: {
          symptoms: symptoms.trim(),
          patientInfo: {
            age: (profile as any)?.date_of_birth,
            gender: (profile as any)?.gender,
            chronicConditions: (profile as any)?.chronic_conditions,
            allergies: (profile as any)?.allergies,
          }
        }
      });

      if (error) throw error;

      const result = data.assessment;
      setAssessment(result);

      // Save session to database
      await supabase.from('symptom_checker_sessions').insert({
        user_id: user!.id,
        symptoms: { description: symptoms },
        ai_assessment: result,
        recommended_specialty: result.recommended_specialty,
        urgency_level: result.urgency_level,
        completed_at: new Date().toISOString(),
      });

      toast({
        title: 'Assessment Complete',
        description: 'AI has analyzed your symptoms',
      });
    } catch (error: any) {
      console.error('Error analyzing symptoms:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze symptoms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      case 'routine': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const bookSpecialist = async () => {
    // Connect triage to booking
    try {
      const { data: session } = await supabase
        .from('symptom_checker_sessions')
        .select('id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        await supabase.functions.invoke('connect-triage-to-booking', {
          body: {
            triage_session_id: session.id,
            specialty: assessment?.recommended_specialty,
            urgency_level: assessment?.urgency_level,
          }
        });
      }
    } catch (error) {
      console.error('Failed to connect triage:', error);
    }

    navigate(`/search/specialists?specialty=${encodeURIComponent(assessment?.recommended_specialty)}&urgency=${assessment?.urgency_level}`);
  };

  return (
    <DashboardLayout title="AI Symptom Checker" description="Get instant triage assessment powered by AI">
      <div className="max-w-4xl space-y-6">
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">This is NOT a medical diagnosis</p>
                <p>AI assessment is for guidance only. For emergencies, call emergency services immediately.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!assessment ? (
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: I've had a persistent headache for 3 days, accompanied by sensitivity to light and nausea..."
                rows={8}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="resize-none"
              />
              <Button 
                onClick={analyzeSymptoms} 
                disabled={loading || !symptoms.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Stethoscope className="mr-2 h-5 w-5" />
                    Analyze Symptoms
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assessment Results</CardTitle>
                <Badge className={getUrgencyColor(assessment.urgency_level)}>
                  {assessment.urgency_level.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {assessment.red_flags && assessment.red_flags.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Red Flags Detected
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                      {assessment.red_flags.map((flag: string, i: number) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Possible Conditions</h3>
                  <div className="space-y-2">
                    {assessment.possible_conditions.map((condition: string, i: number) => (
                      <Badge key={i} variant="outline" className="mr-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recommended Specialist</h3>
                  <Badge variant="default" className="text-base px-4 py-2">
                    {assessment.recommended_specialty}
                  </Badge>
                </div>

                {assessment.questions_for_doctor && assessment.questions_for_doctor.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Questions to Ask Your Doctor</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {assessment.questions_for_doctor.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={bookSpecialist} size="lg" className="flex-1">
                Find {assessment.recommended_specialty} Specialist
              </Button>
              <Button 
                onClick={() => {
                  setAssessment(null);
                  setSymptoms('');
                }} 
                variant="outline"
                size="lg"
              >
                New Assessment
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
