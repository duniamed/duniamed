import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ThumbsUp, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';

interface Question {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  is_anonymous: boolean;
  status: string;
  view_count: number;
  upvote_count: number;
  answer_count: number;
  created_at: string;
  author?: any;
  answers?: Answer[];
}

interface Answer {
  id: string;
  content: string;
  is_verified: boolean;
  is_accepted: boolean;
  upvote_count: number;
  created_at: string;
  author?: any;
}

export default function CommunityQA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    is_anonymous: false,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('community_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to ask questions',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const { error } = await supabase.from('community_questions').insert({
        author_id: user.id,
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        tags: tags.length > 0 ? tags : null,
        is_anonymous: formData.is_anonymous,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question posted successfully',
      });

      setIsAskDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        category: '',
        tags: '',
        is_anonymous: false,
      });
      loadQuestions();
    } catch (error) {
      console.error('Error posting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to post question',
        variant: 'destructive',
      });
    }
  };

  const handleViewQuestion = async (question: Question) => {
    setSelectedQuestion(question);
    
    // Increment view count
    await supabase
      .from('community_questions')
      .update({ view_count: question.view_count + 1 })
      .eq('id', question.id);

    // Load answers
    const { data } = await supabase
      .from('community_answers')
      .select('*')
      .eq('question_id', question.id)
      .order('created_at', { ascending: false });

    setSelectedQuestion({ ...question, answers: data || [] });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 mt-16 max-w-6xl">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Community Q&A</h1>
              <p className="text-muted-foreground">Ask questions and get expert answers</p>
            </div>
            <Dialog open={isAskDialogOpen} onOpenChange={setIsAskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ask a Question</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAskQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Question Title</Label>
                    <Input
                      id="title"
                      required
                      placeholder="What would you like to know?"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Details</Label>
                    <Textarea
                      id="content"
                      required
                      rows={6}
                      placeholder="Provide more context about your question..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      placeholder="e.g., General Health, Nutrition, Mental Health"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., diabetes, medication, symptoms"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAskDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Post Question</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {selectedQuestion ? (
            <div className="space-y-4">
              <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
                ← Back to Questions
              </Button>
              <Card>
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{selectedQuestion.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {selectedQuestion.category && (
                        <Badge variant="secondary">{selectedQuestion.category}</Badge>
                      )}
                      {selectedQuestion.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                      <Badge variant={selectedQuestion.status === 'answered' ? 'default' : 'secondary'}>
                        {selectedQuestion.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{selectedQuestion.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{selectedQuestion.view_count} views</span>
                    <span>{selectedQuestion.answer_count} answers</span>
                    <span>Posted {new Date(selectedQuestion.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{selectedQuestion.answer_count} Answers</h3>
                {selectedQuestion.answers?.map((answer) => (
                  <Card key={answer.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Button variant="ghost" size="sm" className="flex-col gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{answer.upvote_count}</span>
                        </Button>
                        <div className="flex-1">
                          <p>{answer.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {answer.is_verified && (
                              <Badge>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified Answer
                              </Badge>
                            )}
                            {answer.is_accepted && (
                              <Badge variant="secondary">Accepted</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(answer.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewQuestion(question)}>
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle>{question.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {question.category && (
                          <Badge variant="secondary">{question.category}</Badge>
                        )}
                        {question.tags?.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{question.view_count} views</span>
                      <span>{question.answer_count} answers</span>
                      <span>{question.upvote_count} upvotes</span>
                      <Badge variant={question.status === 'answered' ? 'default' : 'outline'}>
                        {question.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}