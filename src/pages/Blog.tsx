import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function Blog() {
  const posts = [
    {
      title: 'The Future of Telemedicine: Trends to Watch in 2025',
      excerpt: 'Explore how virtual healthcare is evolving and what it means for patients and providers worldwide.',
      category: 'Industry Insights',
      author: 'Dr. Sarah Chen',
      date: '2025-01-15',
      readTime: '5 min read',
    },
    {
      title: 'Understanding HIPAA Compliance in Telehealth',
      excerpt: 'A comprehensive guide to maintaining patient privacy and security in virtual consultations.',
      category: 'Compliance',
      author: 'Michael Rodriguez',
      date: '2025-01-10',
      readTime: '8 min read',
    },
    {
      title: 'How to Prepare for Your First Virtual Consultation',
      excerpt: 'Essential tips for patients to get the most out of their telemedicine appointments.',
      category: 'Patient Resources',
      author: 'Dr. Emily Thompson',
      date: '2025-01-05',
      readTime: '4 min read',
    },
    {
      title: 'Cross-Border Healthcare: Breaking Down Barriers',
      excerpt: 'How DUNIAMED is making specialized care accessible across international boundaries.',
      category: 'Company News',
      author: 'James Wilson',
      date: '2024-12-28',
      readTime: '6 min read',
    },
    {
      title: 'Building Trust in Digital Healthcare',
      excerpt: 'Why verification and transparency are crucial for telemedicine platforms.',
      category: 'Industry Insights',
      author: 'Dr. Maria Santos',
      date: '2024-12-20',
      readTime: '5 min read',
    },
    {
      title: 'The Role of AI in Modern Healthcare Diagnostics',
      excerpt: 'How artificial intelligence is augmenting healthcare professionals\' capabilities.',
      category: 'Technology',
      author: 'Dr. David Lee',
      date: '2024-12-15',
      readTime: '7 min read',
    },
  ];

  const categories = ['All', 'Industry Insights', 'Patient Resources', 'Compliance', 'Technology', 'Company News'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="gradient-hero py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                DUNIAMED Blog
              </h1>
              <p className="text-xl text-muted-foreground">
                Insights, updates, and perspectives on the future of global healthcare
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 container px-4 border-b">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button key={category} variant={category === 'All' ? 'default' : 'outline'}>
                {category}
              </Button>
            ))}
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16 container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.title} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {post.category}
                  </Badge>
                  <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-between">
                    Read Article
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <Card className="max-w-2xl mx-auto text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Stay Updated</CardTitle>
                <CardDescription>
                  Subscribe to our newsletter for the latest insights and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 border rounded-md"
                  />
                  <Button>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
