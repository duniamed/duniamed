import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * C10 PROCEDURES - Q&A System
 * 
 * PATIENT WORKFLOW:
 * 1. Browse procedure catalog
 * 2. Ask questions about specific procedures
 * 3. Questions automatically routed to specialists with that expertise
 * 4. Receive expert answers with verification status
 * 5. Get match notifications when specialists respond
 * 
 * SPECIALIST WORKFLOW:
 * 1. Receive questions related to their procedures
 * 2. Answer with clinical expertise
 * 3. Verified answers boost credibility
 * 4. Engagement tracked for quality metrics
 */

interface Question {
  id: string;
  question: string;
  status: string;
  priority: string;
  created_at: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer: string;
  is_verified: boolean;
  created_at: string;
  specialist: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ProcedureQAProps {
  procedureId: string;
  procedureName: string;
}

export function ProcedureQA({ procedureId, procedureName }: ProcedureQAProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [procedureId]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('procedure_questions')
        .select(`
          id,
          question,
          status,
          priority,
          created_at,
          answers:procedure_answers(
            id,
            answer,
            is_verified,
            created_at,
            specialist:answered_by(
              user:user_id(first_name, last_name)
            )
          )
        `)
        .eq('procedure_id', procedureId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setQuestions(data as any || []);
    } catch (error: any) {
      console.error('Error loading questions:', error);
    }
  };

  const askQuestion = async () => {
    if (!user || !newQuestion.trim()) {
      toast({
        title: "Question required",
        description: "Please enter your question",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('procedure_questions')
        .insert({
          procedure_id: procedureId,
          patient_id: user.id,
          question: newQuestion,
          status: 'pending',
          priority: 'normal'
        });

      if (error) throw error;

      toast({
        title: "Question submitted",
        description: "Specialists will be notified and will respond soon"
      });

      setNewQuestion('');
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ask Experts about {procedureName}
          </CardTitle>
          <CardDescription>
            Get answers from verified specialists who perform this procedure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ask Question */}
          <div className="space-y-2">
            <Textarea
              placeholder="What would you like to know about this procedure?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
            <Button onClick={askQuestion} disabled={loading}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </div>

          {/* Questions & Answers */}
          <div className="space-y-4 pt-4 border-t">
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No questions yet. Be the first to ask!
              </p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{q.question}</p>
                    <Badge variant={q.status === 'answered' ? 'default' : 'secondary'}>
                      {q.status === 'answered' ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Answered</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Asked {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                  </p>

                  {/* Answers */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="pl-4 border-l-2 space-y-3">
                      {q.answers.map((a: any) => (
                        <div key={a.id} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              Dr. {a.specialist?.user?.first_name} {a.specialist?.user?.last_name}
                            </span>
                            {a.is_verified && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified Answer
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{a.answer}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
