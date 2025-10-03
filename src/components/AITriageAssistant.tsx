import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, Activity, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface TriageResult {
  urgency: 'emergency' | 'urgent' | 'routine' | 'non-urgent';
  recommended_specialty: string;
  reason: string;
  red_flags: string[];
  suggested_questions: string[];
  estimated_wait_time: string;
}

export default function AITriageAssistant() {
  const [symptoms, setSymptoms] = useState('');
  const [triaging, setTriaging] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const performTriage = async () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setTriaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-symptom-checker', {
        body: {
          symptoms,
          action: 'triage'
        }
      });

      if (error) throw error;

      setResult(data);
      toast.success('Triage completed');
    } catch (error: any) {
      toast.error('Triage failed: ' + error.message);
    } finally {
      setTriaging(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'routine':
        return 'bg-blue-500';
      case 'non-urgent':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5" />;
      case 'urgent':
        return <Activity className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Bot className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">AI Triage Assistant</h2>
        </div>
        <p className="text-muted-foreground">
          Get instant AI-powered assessment of your symptoms and recommended care level
        </p>
        <Badge variant="outline" className="mt-2">
          HIPAA-Compliant · Not a replacement for emergency services
        </Badge>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe your symptoms
            </label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: I have a persistent headache for 3 days, mild fever, and feel dizzy when standing up..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Include: duration, severity, associated symptoms, and anything that makes it better or worse
            </p>
          </div>

          <Button 
            onClick={performTriage} 
            disabled={triaging || !symptoms.trim()}
            className="w-full"
            size="lg"
          >
            {triaging ? (
              <>
                <Bot className="w-4 h-4 mr-2 animate-spin" />
                Analyzing symptoms...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Get AI Triage Assessment
              </>
            )}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getUrgencyColor(result.urgency)} text-white`}>
                {getUrgencyIcon(result.urgency)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">Urgency Level:</h3>
                  <Badge className={getUrgencyColor(result.urgency)}>
                    {result.urgency.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{result.reason}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Recommended Specialty:</p>
                    <Badge variant="outline" className="text-base">
                      {result.recommended_specialty}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Estimated Wait Time:</p>
                    <Badge variant="outline" className="text-base">
                      <Clock className="w-4 h-4 mr-1" />
                      {result.estimated_wait_time}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {result.red_flags && result.red_flags.length > 0 && (
            <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Warning Signs Detected
                  </h4>
                  <ul className="space-y-1">
                    {result.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-800 dark:text-red-200">
                        • {flag}
                      </li>
                    ))}
                  </ul>
                  {result.urgency === 'emergency' && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        ⚠️ SEEK IMMEDIATE MEDICAL ATTENTION
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                        Call emergency services (911) or go to the nearest emergency room immediately.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {result.suggested_questions && result.suggested_questions.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-3">Questions to Ask Your Doctor:</h4>
              <ul className="space-y-2">
                {result.suggested_questions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5" />
                    <span className="text-sm">{question}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Ready to book an appointment?</h4>
                <p className="text-sm text-muted-foreground">
                  Based on your triage, we recommend seeing a {result.recommended_specialty} specialist
                </p>
              </div>
              <Button size="lg">
                Book Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-muted">
        <p className="text-xs text-center text-muted-foreground">
          <strong>Disclaimer:</strong> This AI triage is for informational purposes only and does not replace 
          professional medical advice. If you are experiencing a medical emergency, call 911 immediately.
        </p>
      </Card>
    </div>
  );
}
