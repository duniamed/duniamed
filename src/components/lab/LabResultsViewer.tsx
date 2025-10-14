import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LabResultsViewerProps {
  patientId: string;
}

const LabResultsViewer = ({ patientId }: LabResultsViewerProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const fetchLabResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lab-results-integration', {
        body: { 
          patientId,
          labProvider: 'LabCorp',
          testType: 'Complete Blood Count'
        }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Lab results fetched",
        description: "Latest test results retrieved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to fetch results",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <Badge variant="outline" className="bg-green-50">Normal</Badge>;
      case 'abnormal': return <Badge variant="destructive">Abnormal</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Lab Results
        </CardTitle>
        <CardDescription>View and analyze laboratory test results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchLabResults} disabled={loading} className="w-full">
          {loading ? 'Loading...' : 'Fetch Latest Results'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{results.labResults.test_type}</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(results.labResults.results).map(([test, data]: [string, any]) => (
                <div key={test} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium capitalize">{test.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Normal: {data.normal_range}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">{data.value} {data.unit}</p>
                    {getStatusBadge(data.status)}
                  </div>
                </div>
              ))}
            </div>

            {results.analysis && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  AI Analysis
                </h4>
                <p className="text-sm">{results.analysis.summary}</p>
                {results.analysis.abnormalities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Abnormalities:</p>
                    <ul className="text-sm list-disc list-inside">
                      {results.analysis.abnormalities.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LabResultsViewer;
