import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AISymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symptoms.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-check', {
        body: {
          symptoms: symptoms.trim(),
          age: age || undefined,
          gender: gender || undefined,
          medicalHistory: medicalHistory.trim() || undefined,
        }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Assessment Complete",
        description: "AI has analyzed your symptoms",
      });
    } catch (error: any) {
      console.error('Symptom check error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process symptoms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    // Auto-add to waitlist if urgency detected
    if (result?.urgency_level === 'urgent' || result?.urgency_level === 'emergency') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && result?.suggested_specialties?.length > 0) {
          // Auto-insert to waiting list for first suggested specialist
          await supabase.from('appointment_waitlist').insert({
            patient_id: user.id,
            specialist_id: result.suggested_specialties[0].specialist_id,
            notes: `AI Symptom Checker - ${result.urgency_level}: ${symptoms.substring(0, 100)}`,
            status: 'waiting'
          });
          
          toast({
            title: "Added to Priority Waitlist",
            description: `You've been added to the urgent care queue for ${result.suggested_specialties[0].name}`,
          });
        }
      } catch (error) {
        console.error('Failed to add to waitlist:', error);
      }
    }
    navigate('/book-appointment');
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">AI Symptom Checker</h1>
        <p className="text-muted-foreground">
          Get educational information about your symptoms from approved medical sources
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This tool provides educational information only. It does NOT provide medical diagnoses. 
          Always consult with a qualified healthcare provider for medical advice.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Symptoms</CardTitle>
          <CardDescription>
            Provide as much detail as possible to get the most accurate information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms *</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe your symptoms in detail (e.g., headache, fever, duration, severity...)"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="0"
                  max="120"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender (optional)</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History (optional)</Label>
              <Textarea
                id="medicalHistory"
                placeholder="Any relevant medical conditions, medications, or allergies"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyzing Symptoms...' : 'Get Assessment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Assessment Results
            </CardTitle>
            <CardDescription>
              Based on {result.sources_used} approved medical sources (v{result.config_version})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{result.assessment}</div>
            </div>

            {result.citations && result.citations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  Medical Sources Referenced:
                </h3>
                <div className="space-y-2">
                  {result.citations.map((citation: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-primary pl-4 py-2 bg-muted/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{citation.source_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {citation.source_key} • {citation.version}
                          </div>
                          <div className="text-sm italic">"{citation.excerpt}"</div>
                        </div>
                        {citation.uri && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(citation.uri, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong> This information is for educational purposes. 
                We recommend booking an appointment with a healthcare provider for proper evaluation and treatment.
              </AlertDescription>
            </Alert>

            <Button onClick={handleBookAppointment} className="w-full" size="lg">
              Book Appointment with a Specialist
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
