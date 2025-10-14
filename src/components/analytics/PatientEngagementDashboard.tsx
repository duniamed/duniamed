import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";

interface PatientEngagementDashboardProps {
  patientId: string;
}

export function PatientEngagementDashboard({ patientId }: PatientEngagementDashboardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-engagement', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('patient-engagement-score', {
        body: { patientId, timeframe: 90 }
      });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading engagement data...</CardContent></Card>;
  }

  const engagement = data?.engagement;
  if (!engagement) return null;

  const getTrendIcon = () => {
    if (engagement.trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (engagement.trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Patient Engagement Score
        </CardTitle>
        <CardDescription>
          AI-analyzed engagement metrics and trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(engagement.score)}`}>
                {engagement.score}
              </span>
              <span className="text-muted-foreground">/100</span>
              {getTrendIcon()}
            </div>
          </div>
          <Progress value={engagement.score} className="h-2" />
        </div>

        {engagement.engagementFactors?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Engagement Factors</h4>
            <div className="flex flex-wrap gap-2">
              {engagement.engagementFactors.map((factor: string, i: number) => (
                <Badge key={i} variant="outline">{factor}</Badge>
              ))}
            </div>
          </div>
        )}

        {engagement.recommendations?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {engagement.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
