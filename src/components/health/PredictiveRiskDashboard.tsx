import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, TrendingUp, Heart, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const PredictiveRiskDashboard: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [loading, setLoading] = useState(false);
  const [riskProfile, setRiskProfile] = useState<any>(null);
  const { toast } = useToast();

  const calculateRisk = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-health-risk', {
        body: {
          patientId,
          riskFactors: {},
          medicalHistory: {},
          vitalSigns: {},
          lifestyle: {}
        }
      });

      if (error) throw error;
      setRiskProfile(data.riskProfile);
      toast({ title: 'Risk assessment completed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Predictive Health Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={calculateRisk} disabled={loading}>
            {loading ? 'Analyzing...' : 'Calculate Risk Profile'}
          </Button>

          {riskProfile && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4" />
                      Cardiovascular Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={riskProfile.cardiovascularRisk} />
                    <p className="text-2xl font-bold mt-2">{riskProfile.cardiovascularRisk}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4" />
                      Diabetes Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={riskProfile.diabetesRisk} />
                    <p className="text-2xl font-bold mt-2">{riskProfile.diabetesRisk}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Overall Risk Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`inline-block px-4 py-2 rounded-full ${
                    riskProfile.riskCategory === 'critical' ? 'bg-red-500' :
                    riskProfile.riskCategory === 'high' ? 'bg-orange-500' :
                    riskProfile.riskCategory === 'moderate' ? 'bg-yellow-500' :
                    'bg-green-500'
                  } text-white font-bold`}>
                    {riskProfile.riskCategory.toUpperCase()}
                  </div>
                  <p className="mt-2">Overall Score: {riskProfile.overallRiskScore}/100</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Intervention Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {riskProfile.interventionRecommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 mt-1 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
