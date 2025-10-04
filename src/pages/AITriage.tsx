import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Loader2, Sparkles } from "lucide-react";

export default function AITriage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTriage = async () => {
    if (!message.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-clinic-triage', {
        body: { message, clinicId: null, patientId: null }
      });

      if (error) throw error;

      setResult(data);
      toast({ title: "Triage completed", description: "AI assessment generated successfully" });
    } catch (error: any) {
      console.error('Triage error:', error);
      toast({
        title: "Triage failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'destructive';
      case 'urgent': return 'default';
      case 'routine': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            AI Triage Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered patient message triage for clinic staff
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient Message</CardTitle>
              <CardDescription>
                Enter patient message or symptoms for AI triage assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: Patient reports severe chest pain radiating to left arm, shortness of breath, started 30 minutes ago..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <Button
                onClick={handleTriage}
                disabled={loading || !message.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run AI Triage
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Triage Assessment</CardTitle>
              <CardDescription>
                AI-generated triage recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Submit a message to see AI triage assessment</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing message...</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Urgency Level:</span>
                    <Badge variant={getUrgencyColor(result.urgency)}>
                      {result.urgency.toUpperCase()}
                    </Badge>
                  </div>

                  {result.suggestedSpecialist && (
                    <div>
                      <span className="font-semibold">Suggested Specialist:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.suggestedSpecialist}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold">Full Assessment:</span>
                    <div className="mt-2 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {result.assessment}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Generated at {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• AI analyzes patient messages using active triage configuration</p>
            <p>• Assigns urgency level (routine, urgent, emergency)</p>
            <p>• Suggests appropriate specialist type</p>
            <p>• Flags potential red flags requiring immediate attention</p>
            <p>• All assessments are logged for audit and compliance</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
