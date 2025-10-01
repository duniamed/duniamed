import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ThumbsUp, Eye } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  view_count: number;
  is_pinned: boolean;
  created_at: string;
}

export default function SpecialistForums() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadPosts();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('forum_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading posts',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p>Loading forums...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Specialist Forums</h1>
          </div>
          <p className="text-muted-foreground">
            Discuss cases and share knowledge with peers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={!selectedCategory ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Topics
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3 space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.is_pinned && (
                          <Badge variant="secondary">Pinned</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>0</span>
                    </div>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {posts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts in this category</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}