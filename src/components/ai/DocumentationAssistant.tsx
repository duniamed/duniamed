import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Copy } from 'lucide-react';

export default function DocumentationAssistant() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [documentation, setDocumentation] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-documentation-assistant', {
        body: {
          consultation_transcript: transcript,
          visit_type: 'general'
        }
      });

      if (error) throw error;

      setDocumentation(data.documentation);
      toast({
        title: "Documentation Generated",
        description: "Clinical notes have been created",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">AI Documentation Assistant</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Consultation Transcript</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste consultation transcript here..."
              className="min-h-[120px]"
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading || !transcript}>
            Generate Documentation
          </Button>
        </div>
      </Card>

      {documentation && (
        <Card className="p-6">
          <Tabs defaultValue="soap">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="soap">SOAP Note</TabsTrigger>
              <TabsTrigger value="codes">Codes</TabsTrigger>
              <TabsTrigger value="meds">Medications</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="soap" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">SOAP Note</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(documentation.soap_note)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="p-4 bg-secondary rounded whitespace-pre-wrap text-sm">
                {documentation.soap_note}
              </div>
            </TabsContent>

            <TabsContent value="codes" className="space-y-3 mt-4">
              <div>
                <h4 className="font-medium mb-2">ICD-10 Codes</h4>
                <div className="space-y-1">
                  {documentation.icd10_codes?.map((code: string, idx: number) => (
                    <div key={idx} className="p-2 bg-secondary rounded text-sm font-mono">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">CPT Codes</h4>
                <div className="space-y-1">
                  {documentation.cpt_codes?.map((code: string, idx: number) => (
                    <div key={idx} className="p-2 bg-secondary rounded text-sm font-mono">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meds" className="space-y-2 mt-4">
              <h4 className="font-medium">Medication List</h4>
              {documentation.medication_list?.map((med: any, idx: number) => (
                <div key={idx} className="p-3 bg-secondary rounded">
                  <p className="font-medium text-sm">{med}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="plan" className="space-y-3 mt-4">
              <div>
                <h4 className="font-medium mb-2">Follow-Up Plan</h4>
                <p className="text-sm text-muted-foreground">{documentation.follow_up_plan}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Patient Instructions</h4>
                <p className="text-sm text-muted-foreground">{documentation.patient_instructions}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Clinical Impression</h4>
                <p className="text-sm text-muted-foreground">{documentation.clinical_impression}</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
