import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Save, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BlogAdmin() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const generateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the blog post",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/generate-blog-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            tone,
            length,
            saveDraft: true
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data);
      
      toast({
        title: "Content generated!",
        description: "Your blog post has been created and saved as a draft.",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate blog content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishPost = async () => {
    if (!generatedContent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = generatedContent.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: generatedContent.title,
          slug,
          content: generatedContent.content,
          excerpt: generatedContent.excerpt,
          author_id: user.id,
          status: 'published',
          published_at: new Date().toISOString(),
          tags: generatedContent.tags,
          seo_description: generatedContent.seoDescription,
          reading_time_minutes: generatedContent.readingTimeMinutes
        });

      if (error) throw error;

      toast({
        title: "Published!",
        description: "Your blog post is now live.",
      });

      loadPosts();
      setGeneratedContent(null);
      setTopic('');
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Publishing failed",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout title="Blog Management">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Content Generator */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">AI Content Generator</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Telemedicine benefits"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="inspiring">Inspiring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <Select value={length} onValueChange={setLength} disabled={isGenerating}>
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (300-500 words)</SelectItem>
                  <SelectItem value="medium">Medium (700-1000 words)</SelectItem>
                  <SelectItem value="long">Long (1500-2000 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateContent} 
            disabled={isGenerating || !topic.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating content...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Blog Post
              </>
            )}
          </Button>
        </Card>

        {/* Generated Content Preview */}
        {generatedContent && (
          <Card className="p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Generated Content</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={publishPost} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Publish Post
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-2xl font-bold text-foreground mb-2">
                  {generatedContent.title}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {generatedContent.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {generatedContent.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>

              <div className="prose max-w-none">
                <Textarea
                  value={generatedContent.content}
                  onChange={(e) => setGeneratedContent({
                    ...generatedContent,
                    content: e.target.value
                  })}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Published Posts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Published Posts</h2>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No published posts yet. Generate and publish your first post above!
              </p>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        <span>{post.reading_time_minutes} min read</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
