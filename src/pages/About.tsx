import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, Shield, Heart, Target, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <Layout>
        {/* Hero Section with Social Proof */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20">
                <TrendingUp className="h-3.5 w-3.5" />
                Trusted by 500,000+ patients worldwide
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                We're making healthcare accessible
                <span className="block text-primary mt-2">For everyone, everywhere</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Join the movement transforming global healthcare. Over 10,000 verified specialists helping patients get the care they deserve - no matter where they are.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section with Stats */}
        <section className="py-16 md:py-20 container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Our Mission: Healthcare that doesn't make you wait</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We're tired of watching people suffer while waiting weeks for appointments. We're fed up with patients paying thousands for simple ER visits. We're done with geography limiting access to specialists.
              </p>
              <p className="text-foreground font-medium text-lg">
                That's why we built DUNIAMED - to give you immediate access to world-class specialists at a fraction of traditional costs.
              </p>
              
              <div className="bg-primary/5 rounded-xl p-6 border-l-4 border-primary">
                <p className="font-semibold mb-2">Our Promise:</p>
                <ul className="space-y-2">
                  {[
                    "See specialists in minutes, not weeks",
                    "Pay $0-79 instead of $800-2000",
                    "Access care 24/7 from anywhere",
                    "100% HIPAA-compliant security"
                  ].map((promise) => (
                    <li key={promise} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{promise}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-all">
                <Users className="h-10 w-10 text-primary mb-3 mx-auto" />
                <CardTitle className="text-3xl font-bold mb-2">10K+</CardTitle>
                <CardDescription>Verified Specialists</CardDescription>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-all">
                <Globe className="h-10 w-10 text-primary mb-3 mx-auto" />
                <CardTitle className="text-3xl font-bold mb-2">150+</CardTitle>
                <CardDescription>Countries Served</CardDescription>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-all">
                <Shield className="h-10 w-10 text-primary mb-3 mx-auto" />
                <CardTitle className="text-3xl font-bold mb-2">100%</CardTitle>
                <CardDescription>HIPAA Compliant</CardDescription>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-all">
                <Heart className="h-10 w-10 text-primary mb-3 mx-auto" />
                <CardTitle className="text-3xl font-bold mb-2">1M+</CardTitle>
                <CardDescription>Happy Patients</CardDescription>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Target className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Patient First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every decision we make prioritizes patient safety, privacy, and access to quality care.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Trust & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We maintain the highest standards of data security and privacy protection across all our services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We verify all healthcare professionals and continuously improve our platform to deliver exceptional care.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 container px-4">
          <Card className="max-w-3xl mx-auto p-8 md:p-12 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to experience better healthcare?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join 500,000+ patients who stopped waiting and started healing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 text-base shadow-lg" asChild>
                <Link to="/auth?mode=signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2" asChild>
                <Link to="/search">Browse Specialists</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              ✓ No credit card required ✓ See specialists in minutes ✓ Cancel anytime
            </p>
          </Card>
        </section>
    </Layout>
  );
}
