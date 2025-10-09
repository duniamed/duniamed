import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Save, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AIBlogGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'friendly'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');

  const generateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your blog post",
        variant: "destructive",
      });
      return;
    }

    if (topic.length < 5 || topic.length > 200) {
      toast({
        title: "Invalid topic length",
        description: "Topic must be between 5 and 200 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { topic, tone, length }
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }
        throw error;
      }

      if (data?.content) {
        setGeneratedContent(data.content);
        setTitle(data.title || topic);
        toast({
          title: "Content generated!",
          description: "Your blog post has been created successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate blog content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const saveDraft = async () => {
    if (!generatedContent || !user) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: title || topic,
          slug: generateSlug(title || topic),
          content: generatedContent,
          author_id: user.id,
          status: 'draft',
          tags: [topic],
        } as any);

      if (error) throw error;

      toast({
        title: "Draft saved",
        description: "Your blog post has been saved as a draft",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  const publishPost = async () => {
    if (!generatedContent || !user) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: title || topic,
          slug: generateSlug(title || topic),
          content: generatedContent,
          author_id: user.id,
          status: 'published',
          published_at: new Date().toISOString(),
          tags: [topic],
        } as any);

      if (error) throw error;

      toast({
        title: "Post published!",
        description: "Your blog post is now live",
      });

      // Reset form
      setTopic('');
      setGeneratedContent('');
      setTitle('');
    } catch (error: any) {
      toast({
        title: "Publish failed",
        description: error.message || "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout
      title="AI Blog Generator"
      description="Generate high-quality blog content with AI"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Content
            </CardTitle>
            <CardDescription>
              Configure your blog post parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Latest advances in telemedicine"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {topic.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={(value: any) => setLength(value)}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (300-500 words)</SelectItem>
                  <SelectItem value="medium">Medium (500-1000 words)</SelectItem>
                  <SelectItem value="long">Long (1000-2000 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateContent}
              disabled={loading || !topic.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              Review and edit your AI-generated blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedContent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Blog post title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Generated content will appear here..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveDraft} variant="outline" className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button onClick={publishPost} className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate content to see it here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
