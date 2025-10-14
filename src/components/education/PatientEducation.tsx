import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PatientEducationProps {
  patientId: string;
  condition?: string;
}

const PatientEducation = ({ patientId, condition }: PatientEducationProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [topic, setTopic] = useState('');
  const { toast } = useToast();

  const generateContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-education-content', {
        body: { 
          patientId,
          topic: topic || condition,
          condition: condition || 'general health',
          language: 'English'
        }
      });

      if (error) throw error;

      setContent(data.educationContent);
      toast({
        title: "Educational content generated",
        description: "Personalized information is ready",
      });
    } catch (error: any) {
      toast({
        title: "Failed to generate content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Patient Education
        </CardTitle>
        <CardDescription>Get personalized health information and guidance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={condition ? `Learn about ${condition}` : "Enter a health topic"}
          />
          <Button onClick={generateContent} disabled={loading}>
            {loading ? 'Loading...' : 'Generate'}
          </Button>
        </div>

        {content && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
              <p className="text-sm text-muted-foreground">{content.content}</p>
            </div>

            {content.key_points && content.key_points.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {content.key_points.map((point: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {content.do_list && content.do_list.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Do
                  </h4>
                  <ul className="space-y-1">
                    {content.do_list.map((item: string, i: number) => (
                      <li key={i} className="text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {content.dont_list && content.dont_list.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Don't
                  </h4>
                  <ul className="space-y-1">
                    {content.dont_list.map((item: string, i: number) => (
                      <li key={i} className="text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {content.when_to_seek_help && content.when_to_seek_help.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  When to Seek Help
                </h4>
                <ul className="space-y-1">
                  {content.when_to_seek_help.map((item: string, i: number) => (
                    <li key={i} className="text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientEducation;
