import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Search, MessageSquare, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProcedureMatchNotifications from '@/components/ProcedureMatchNotifications';

interface Procedure {
  id: string;
  procedure_name: string;
  category: string;
  description: string;
  average_duration: number;
  typical_cost_range: any;
  symptoms_treated: string[];
  success_rate: number;
}

interface Question {
  id: string;
  question: string;
  status: string;
  created_at: string;
  procedure_catalog: {
    procedure_name: string;
  };
}

function ProcedureCatalogContent() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProcedures();
    loadQuestions();
  }, []);

  const loadProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('procedure_catalog')
        .select('*')
        .eq('is_active', true)
        .order('procedure_name');

      if (error) throw error;
      setProcedures((data || []) as Procedure[]);
    } catch (error: any) {
      toast({
        title: 'Error loading procedures',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('procedure_questions')
        .select(`
          *,
          procedure_catalog!procedure_questions_procedure_id_fkey (procedure_name)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions((data || []) as any);
    } catch (error: any) {
      console.error('Error loading questions:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedProcedure || !newQuestion.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter your question',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('procedure_questions')
        .insert({
          procedure_id: selectedProcedure.id,
          patient_id: user.id,
          question: newQuestion,
        });

      if (error) throw error;

      toast({
        title: 'Question submitted',
        description: 'A specialist will answer your question soon',
      });

      setNewQuestion('');
      setSelectedProcedure(null);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Error submitting question',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredProcedures = procedures.filter((proc) => {
    const matchesSearch = proc.procedure_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proc.symptoms_treated?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || proc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(procedures.map(p => p.category))];

  return (
    <DashboardLayout>
      <div className="container-modern py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Procedure Catalog
            </h1>
            <p className="text-muted-foreground mt-2">
              Search treatments by symptoms and ask specialists questions
            </p>
          </div>

          {/* C10: Procedure Match Notifications */}
          <ProcedureMatchNotifications />

          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalog">Browse Procedures</TabsTrigger>
              <TabsTrigger value="questions">My Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by procedure, symptom, or condition..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Procedures Grid */}
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Loading procedures...
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredProcedures.map((procedure) => (
                    <Card key={procedure.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{procedure.procedure_name}</CardTitle>
                            <CardDescription>
                              <Badge variant="outline" className="mt-1">
                                {procedure.category}
                              </Badge>
                            </CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProcedure(procedure)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Ask
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ask About {procedure.procedure_name}</DialogTitle>
                                <DialogDescription>
                                  Your question will be routed to verified specialists
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Your Question</Label>
                                  <Textarea
                                    placeholder="What would you like to know about this procedure?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <Button onClick={handleAskQuestion} className="w-full">
                                  Submit Question
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{procedure.description}</p>
                        
                        {procedure.symptoms_treated && procedure.symptoms_treated.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-1">Treats:</p>
                            <div className="flex flex-wrap gap-1">
                              {procedure.symptoms_treated.slice(0, 3).map((symptom, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          {procedure.average_duration && (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {procedure.average_duration}min
                            </div>
                          )}
                          {procedure.success_rate && (
                            <div className="flex items-center gap-1 text-xs">
                              <TrendingUp className="h-3 w-3" />
                              {procedure.success_rate}%
                            </div>
                          )}
                          {procedure.typical_cost_range && (
                            <div className="flex items-center gap-1 text-xs">
                              <DollarSign className="h-3 w-3" />
                              {procedure.typical_cost_range.min}-{procedure.typical_cost_range.max}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                    <p className="text-muted-foreground">
                      Ask specialists about procedures from the catalog
                    </p>
                  </CardContent>
                </Card>
              ) : (
                questions.map((q) => (
                  <Card key={q.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{q.question}</CardTitle>
                          <CardDescription>
                            About: {q.procedure_catalog.procedure_name}
                          </CardDescription>
                        </div>
                        <Badge>{q.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Asked on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProcedureCatalog() {
  return <ProcedureCatalogContent />;
}
