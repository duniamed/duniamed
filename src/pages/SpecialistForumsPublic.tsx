import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, ThumbsUp, Search, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SpecialistForumsPublic() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'General Health',
    'Cardiology',
    'Dermatology',
    'Mental Health',
    'Pediatrics',
    'Orthopedics',
    'Women\'s Health',
    'Nutrition'
  ];

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    try {
      let query = supabase
        .from('community_questions')
        .select(`
          *,
          author:author_id(first_name, last_name),
          community_answers(
            id,
            content,
            is_verified,
            is_accepted,
            upvote_count,
            author_id
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const postQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestionTitle || !newQuestionContent) return;

    setPostingQuestion(true);
    try {
      const { error } = await supabase
        .from('community_questions')
        .insert([{
          author_id: user.id,
          title: newQuestionTitle,
          content: newQuestionContent,
          category: selectedCategory === 'all' ? 'General Health' : selectedCategory,
          status: 'open'
        }]);

      if (error) throw error;

      toast({
        title: 'Question posted',
        description: 'Your question has been submitted to the community'
      });

      setNewQuestionTitle('');
      setNewQuestionContent('');
      loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post question',
        variant: 'destructive'
      });
    } finally {
      setPostingQuestion(false);
    }
  };

  const upvoteAnswer = async (answerId: string) => {
    // In production, implement upvote tracking table
    toast({
      title: 'Vote recorded',
      description: 'Thank you for your feedback'
    });
  };

  const filteredQuestions = questions.filter(q => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      q.content.toLowerCase().includes(query) ||
      q.category?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold">Health Q&A Community</h1>
          <p className="text-muted-foreground mt-2">
            Ask questions and get answers from verified healthcare professionals
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>
                  Get expert medical advice from verified healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={postQuestion} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Question Title</Label>
                    <Input
                      id="title"
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      placeholder="Brief summary of your question"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Question Details</Label>
                    <Textarea
                      id="content"
                      value={newQuestionContent}
                      onChange={(e) => setNewQuestionContent(e.target.value)}
                      placeholder="Provide detailed information about your question..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={postingQuestion || !user}>
                    {postingQuestion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Post Question
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground">
                      Please log in to ask questions
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No questions found</p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to ask a question in this category
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredQuestions.map((question) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-xl">{question.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {question.category}
                            </Badge>
                            <Badge
                              variant={
                                question.status === 'open'
                                  ? 'default'
                                  : question.status === 'answered'
                                  ? 'outline'
                                  : 'secondary'
                              }
                            >
                              {question.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {question.answer_count} answers
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {question.view_count} views
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(question.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{question.content}</p>

                      {question.community_answers && question.community_answers.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                          <h4 className="font-medium">Answers ({question.community_answers.length})</h4>
                          {question.community_answers.slice(0, 2).map((answer: any) => (
                            <Card key={answer.id} className="bg-muted/50">
                              <CardContent className="pt-6">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <p className="text-sm flex-1">{answer.content}</p>
                                    {answer.is_verified && (
                                      <Badge variant="default" className="ml-2">
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => upvoteAnswer(answer.id)}
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      {answer.upvote_count || 0}
                                    </Button>
                                    {answer.is_accepted && (
                                      <Badge variant="outline" className="bg-green-50">
                                        Accepted Answer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      <Button variant="outline" size="sm">
                        View Full Discussion
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}