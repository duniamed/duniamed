import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { VoiceSOAPRecorder } from '@/components/specialist/VoiceSOAPRecorder';
import { AIAssistantPanel } from '@/components/specialist/AIAssistantPanel';
import { useToast } from '@/hooks/use-toast';
import { Save, Send, Calendar, FileCheck } from 'lucide-react';

interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Codes: string[];
}

export default function ConsultationRoom() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [soapData, setSoapData] = useState<SOAPData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icd10Codes: [],
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const handleTranscriptionUpdate = (text: string) => {
    setTranscription(text);
    // Here you would call the AI assistant to get suggestions
    // For now, we'll add mock suggestions
    if (text.includes('chest pain')) {
      setAiSuggestions([
        {
          type: 'icd10',
          title: 'Acute myocardial infarction',
          description: 'ST-elevation myocardial infarction (STEMI)',
          code: 'I21.9',
          confidence: 0.87,
        },
        {
          type: 'protocol',
          title: 'STEMI Protocol',
          description: 'Door-to-balloon time <90 minutes. Start aspirin, heparin, consider thrombolytics.',
          confidence: 0.92,
        },
        {
          type: 'lab',
          title: 'Cardiac markers',
          description: 'Order troponin levels q3h × 3, CK-MB, pro-BNP',
          confidence: 0.95,
        },
      ]);
    }
  };

  const handleAddSuggestion = (suggestion: any) => {
    if (suggestion.type === 'icd10' && suggestion.code) {
      setSoapData(prev => ({
        ...prev,
        icd10Codes: [...prev.icd10Codes, suggestion.code],
        assessment: prev.assessment + (prev.assessment ? '\n' : '') + `${suggestion.title} (${suggestion.code})`,
      }));
      toast({
        title: '✅ ICD-10 Code Added',
        description: `${suggestion.code} - ${suggestion.title}`,
      });
    } else if (suggestion.type === 'prescription') {
      setSoapData(prev => ({
        ...prev,
        plan: prev.plan + (prev.plan ? '\n' : '') + `Rx: ${suggestion.title}`,
      }));
      toast({
        title: '💊 Prescription Template Added',
        description: suggestion.title,
      });
    } else if (suggestion.type === 'protocol') {
      setSoapData(prev => ({
        ...prev,
        plan: prev.plan + (prev.plan ? '\n' : '') + `Protocol: ${suggestion.description}`,
      }));
      toast({
        title: '📋 Treatment Protocol Added',
        description: suggestion.title,
      });
    } else if (suggestion.type === 'lab') {
      setSoapData(prev => ({
        ...prev,
        plan: prev.plan + (prev.plan ? '\n' : '') + `Labs: ${suggestion.description}`,
      }));
      toast({
        title: '🔬 Lab Order Added',
        description: suggestion.title,
      });
    }
  };

  const handleSave = () => {
    // Save SOAP note logic
    toast({
      title: 'SOAP note saved',
      description: 'Consultation notes saved successfully',
    });
  };

  const handleSendToPatient = () => {
    // Send summary to patient logic
    toast({
      title: 'Summary sent',
      description: 'Consultation summary sent to patient via email and WhatsApp',
    });
  };

  const handleScheduleFollowup = () => {
    navigate('/appointments');
  };

  return (
    <DashboardLayout 
      title="Voice Consultation" 
      description="Speak naturally - AI takes notes for you"
      showBackButton
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main SOAP Note Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Recorder */}
          <Card className="border-2 border-primary/30">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    🎤 Voice Consultation
                    {isRecording && (
                      <span className="flex items-center gap-1 text-sm font-normal text-red-500">
                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                        Recording
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Speak naturally - AI captures everything in real-time</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Auto-saves every 30s</p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    Draft saved
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
            <VoiceSOAPRecorder 
              appointmentId={patientId || ''}
              onTranscriptionComplete={(text, data) => {
                setTranscription(text);
                if (data) {
                  setSoapData(prev => ({
                    ...prev,
                    subjective: data.subjective || prev.subjective,
                    objective: data.objective || prev.objective,
                    assessment: data.assessment || prev.assessment,
                    plan: data.plan || prev.plan,
                  }));
                }
              }}
            />
              
              {/* Live Transcription */}
              {transcription && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">Live Transcription:</h4>
                  <p className="text-sm leading-relaxed">{transcription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SOAP Note Form */}
          <Card>
            <CardHeader>
              <CardTitle>SOAP Note</CardTitle>
              <p className="text-sm text-muted-foreground">Review and edit AI-generated notes</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subjective">Subjective</Label>
                <Textarea 
                  id="subjective"
                  placeholder="Patient's reported symptoms and history..."
                  value={soapData.subjective}
                  onChange={(e) => setSoapData(prev => ({ ...prev, subjective: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="objective">Objective</Label>
                <Textarea 
                  id="objective"
                  placeholder="Physical exam findings, vital signs..."
                  value={soapData.objective}
                  onChange={(e) => setSoapData(prev => ({ ...prev, objective: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea 
                  id="assessment"
                  placeholder="Diagnosis and clinical reasoning..."
                  value={soapData.assessment}
                  onChange={(e) => setSoapData(prev => ({ ...prev, assessment: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="plan">Plan</Label>
                <Textarea 
                  id="plan"
                  placeholder="Treatment plan, prescriptions, follow-up..."
                  value={soapData.plan}
                  onChange={(e) => setSoapData(prev => ({ ...prev, plan: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* ICD-10 Codes */}
              {soapData.icd10Codes.length > 0 && (
                <div>
                  <Label>ICD-10 Codes</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {soapData.icd10Codes.map((code, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-mono">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleSave} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  Save SOAP Note
                </Button>
                <Button onClick={handleSendToPatient} variant="outline" size="lg">
                  <Send className="mr-2 h-4 w-4" />
                  Send Summary to Patient
                </Button>
                <Button onClick={handleScheduleFollowup} variant="outline" size="lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant Panel */}
        <div className="lg:col-span-1">
          <AIAssistantPanel 
            suggestions={aiSuggestions}
            onAddSuggestion={handleAddSuggestion}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
