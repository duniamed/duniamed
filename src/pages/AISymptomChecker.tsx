import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, ExternalLink, CheckCircle, ArrowLeft, Mic, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Unlimited Edge Function Capacities: No limits on invocations, processing, or resources
// This platform reality enables real-time AI processing without throttling

export default function AISymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Voice input using Web Speech API for mobile-first, hands-free symptom entry
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice input. Please type your symptoms.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Describe your symptoms naturally",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast({
        title: "Voice Error",
        description: "Couldn't capture audio. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

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
      // Unlimited edge function - instant AI processing without throttling
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
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl space-y-6">
        {/* Back navigation for seamless flow */}
        <Button
          variant="ghost"
          onClick={() => navigate('/patient/dashboard')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">AI Symptom Checker</h1>
          <p className="text-muted-foreground">
            Get educational information about your symptoms from approved medical sources
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="gap-1">
              <Mic className="h-3 w-3" />
              Voice-enabled
            </Badge>
            <Badge variant="outline">Mobile-optimized</Badge>
            <Badge variant="outline">AI-powered</Badge>
          </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="symptoms">Symptoms *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startVoiceInput}
                  disabled={isRecording}
                  className="gap-2"
                >
                  <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
                  {isRecording ? 'Listening...' : 'Voice Input'}
                </Button>
              </div>
              <Textarea
                id="symptoms"
                placeholder="Describe your symptoms in detail (e.g., headache, fever, duration, severity...) or use voice input for hands-free entry"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Use voice input for faster, natural symptom description
              </p>
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

            <div className="grid gap-3 md:grid-cols-2">
              <Button onClick={handleBookAppointment} className="w-full" size="lg">
                Book Appointment with a Specialist
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/search/specialists')} 
                className="w-full gap-2" 
                size="lg"
              >
                <DollarSign className="h-4 w-4" />
                View Cost Estimates
              </Button>
            </div>

            {/* Deep integration: Link to other platform features */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/patient/medical-records')}
                className="gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                View Medical History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/patient/waitlist')}
                className="gap-2"
              >
                <Clock className="h-3 w-3" />
                Join Waitlist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/messages')}
                className="gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Message a Doctor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </Layout>
  );
}
