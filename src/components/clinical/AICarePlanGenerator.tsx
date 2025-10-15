import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Target, Activity, AlertTriangle, Calendar, BookOpen } from 'lucide-react';

export const AICarePlanGenerator = () => {
  const [carePlan, setCarePlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateCarePlan = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-care-plan-generator', {
        body: {
          patientId: 'patient-id',
          diagnosis: 'Type 2 Diabetes',
          symptoms: ['High blood sugar', 'Fatigue', 'Increased thirst'],
          medicalHistory: {}
        }
      });

      if (error) throw error;

      setCarePlan(data.carePlan);
      toast({
        title: 'Care plan generated',
        description: 'Comprehensive treatment plan created successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'moderate': return 'secondary';
      case 'high': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Care Plan Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={generateCarePlan} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Care Plan'}
          </Button>

          {carePlan && (
            <Tabs defaultValue="goals" className="mt-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="interventions">Interventions</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                <TabsTrigger value="followup">Follow-up</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4">
                {carePlan.care_plan?.goals?.map((goal: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          <h4 className="font-semibold">{goal.goal}</h4>
                        </div>
                        <Badge variant={goal.priority === 'high' ? 'destructive' : 'default'}>
                          {goal.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Timeframe: {goal.timeframe}</p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Measurable Outcomes:</p>
                        <ul className="list-disc list-inside text-sm">
                          {goal.measurable_outcomes?.map((outcome: string, i: number) => (
                            <li key={i}>{outcome}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="interventions" className="space-y-4">
                {carePlan.care_plan?.interventions?.map((intervention: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <Badge className="mb-2">{intervention.type}</Badge>
                      <p className="font-medium mb-2">{intervention.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Frequency:</span> {intervention.frequency}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span> {intervention.duration}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Expected Outcome: {intervention.expected_outcome}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="medications" className="space-y-4">
                {carePlan.care_plan?.medications?.map((med: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-1">{med.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{med.purpose}</p>
                      <p className="text-sm mb-2"><strong>Dosage:</strong> {med.dosage}</p>
                      {med.monitoring_required?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Monitoring Required:</p>
                          <ul className="list-disc list-inside text-sm">
                            {med.monitoring_required.map((monitor: string, i: number) => (
                              <li key={i}>{monitor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="lifestyle" className="space-y-4">
                {carePlan.care_plan?.lifestyle_modifications?.map((mod: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          <h4 className="font-semibold capitalize">{mod.category}</h4>
                        </div>
                        <Badge variant={mod.importance === 'high' ? 'destructive' : 'default'}>
                          {mod.importance}
                        </Badge>
                      </div>
                      <ul className="list-disc list-inside text-sm">
                        {mod.recommendations?.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="followup" className="space-y-4">
                {carePlan.care_plan?.follow_up_schedule?.map((followup: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4 flex items-start gap-3">
                      <Calendar className="h-5 w-5 mt-1" />
                      <div>
                        <h4 className="font-semibold">{followup.type}</h4>
                        <p className="text-sm text-muted-foreground">Frequency: {followup.frequency}</p>
                        <p className="text-sm">{followup.purpose}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {carePlan.care_plan?.warning_signs && (
                  <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold mb-2">Warning Signs</h4>
                          <ul className="list-disc list-inside text-sm">
                            {carePlan.care_plan.warning_signs.map((sign: string, i: number) => (
                              <li key={i}>{sign}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Risk Assessment</CardTitle>
                      <Badge variant={getRiskBadgeVariant(carePlan.risk_assessment?.overall_risk)}>
                        {carePlan.risk_assessment?.overall_risk} Risk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Specific Risks</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {carePlan.risk_assessment?.specific_risks?.map((risk: string, i: number) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Mitigation Strategies</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {carePlan.risk_assessment?.mitigation_strategies?.map((strategy: string, i: number) => (
                          <li key={i}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {carePlan.care_plan?.education_topics && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-5 w-5 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-2">Patient Education Topics</h4>
                          <ul className="list-disc list-inside text-sm">
                            {carePlan.care_plan.education_topics.map((topic: string, i: number) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
