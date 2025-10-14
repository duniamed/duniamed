import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClinicalInsightsDashboardProps {
  entityId: string;
  entityType: 'specialist' | 'clinic';
}

export const ClinicalInsightsDashboard: React.FC<ClinicalInsightsDashboardProps> = ({
  entityId,
  entityType
}) => {
  const { data: insights } = useQuery({
    queryKey: ['clinical-insights', entityId, entityType],
    queryFn: async () => {
      const { data } = await supabase
        .from('analytics_insights_ai')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: treatmentData } = useQuery({
    queryKey: ['treatment-effectiveness', entityId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-analyze-treatment-effectiveness', {
        body: {
          specialistId: entityType === 'specialist' ? entityId : undefined,
          clinicId: entityType === 'clinic' ? entityId : undefined,
          timeframe: 90
        }
      });
      if (error) throw error;
      return data;
    }
  });

  const mockTrendData = [
    { month: 'Jan', patients: 45, revenue: 12000 },
    { month: 'Feb', patients: 52, revenue: 14500 },
    { month: 'Mar', patients: 61, revenue: 17200 },
    { month: 'Apr', patients: 58, revenue: 16800 },
    { month: 'May', patients: 67, revenue: 19500 },
    { month: 'Jun', patients: 74, revenue: 22100 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visit Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28 min</div>
            <p className="text-xs text-muted-foreground">-3 min from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Success</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treatmentData?.overall_effectiveness || 87}%
            </div>
            <p className="text-xs text-muted-foreground">Based on follow-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$22,100</div>
            <p className="text-xs text-muted-foreground">+13% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient & Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="patients"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Clinical Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.slice(0, 5).map((insight: any) => (
              <div
                key={insight.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{insight.insight_type}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.insight_text}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      insight.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : insight.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {insight.priority}
                  </span>
                </div>

                {insight.actionable_items && insight.actionable_items.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold">Recommended Actions:</p>
                    {insight.actionable_items.map((action: string, idx: number) => (
                      <p key={idx} className="text-xs text-muted-foreground pl-4">
                        • {action}
                      </p>
                    ))}
                  </div>
                )}

                {insight.confidence_score && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${insight.confidence_score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(insight.confidence_score * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}

            {(!insights || insights.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No insights available yet. Check back after more consultations.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
