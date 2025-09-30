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
        <section className="section-padding bg-gradient-to-br from-soft-purple via-background to-accent/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[100px]" />
          </div>
          
          <div className="relative container-modern">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Badge className="inline-flex items-center gap-2.5 px-6 py-3 bg-primary/10 border border-primary/20 rounded-full">
                <TrendingUp className="h-4 w-4" />
                Trusted by 500,000+ patients worldwide
              </Badge>
              
              <h1 className="font-display">
                We're making healthcare accessible
                <span className="block gradient-text mt-3">For everyone, everywhere</span>
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed font-light max-w-3xl mx-auto">
                Join the movement transforming global healthcare. Over 10,000 verified specialists helping patients get the care they deserve - no matter where they are.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section with Stats */}
        <section className="section-padding container-modern">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">Our Mission: Healthcare that doesn't make you wait</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We're tired of watching people suffer while waiting weeks for appointments. We're fed up with patients paying thousands for simple ER visits. We're done with geography limiting access to specialists.
              </p>
              <p className="text-foreground font-medium text-xl">
                That's why we built DUNIAMED - to give you immediate access to world-class specialists at a fraction of traditional costs.
              </p>
              
              <div className="glass-panel space-y-2">
                <p className="font-bold text-lg mb-3">Our Promise:</p>
                <ul className="space-y-3">
                  {[
                    "See specialists in minutes, not weeks",
                    "Pay $0-79 instead of $800-2000",
                    "Access care 24/7 from anywhere",
                    "100% HIPAA-compliant security"
                  ].map((promise) => (
                    <li key={promise} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-base">{promise}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="card-modern text-center">
                <Users className="h-12 w-12 text-primary mb-4 mx-auto" />
                <div className="text-4xl font-bold mb-2">10K+</div>
                <p className="text-muted-foreground">Verified Specialists</p>
              </div>
              <div className="card-modern text-center">
                <Globe className="h-12 w-12 text-primary mb-4 mx-auto" />
                <div className="text-4xl font-bold mb-2">150+</div>
                <p className="text-muted-foreground">Countries Served</p>
              </div>
              <div className="card-modern text-center">
                <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-muted-foreground">HIPAA Compliant</p>
              </div>
              <div className="card-modern text-center">
                <Heart className="h-12 w-12 text-primary mb-4 mx-auto" />
                <div className="text-4xl font-bold mb-2">1M+</div>
                <p className="text-muted-foreground">Happy Patients</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="section-padding bg-soft-purple">
          <div className="container-modern">
            <h2 className="text-4xl font-bold text-center mb-16">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-modern group">
                <Target className="h-14 w-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">Patient First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every decision we make prioritizes patient safety, privacy, and access to quality care.
                </p>
              </div>

              <div className="card-modern group">
                <Shield className="h-14 w-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">Trust & Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We maintain the highest standards of data security and privacy protection across all our services.
                </p>
              </div>

              <div className="card-modern group">
                <Award className="h-14 w-14 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">Excellence</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We verify all healthcare professionals and continuously improve our platform to deliver exceptional care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding container-modern">
          <div className="card-modern max-w-4xl mx-auto text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to experience better healthcare?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join 500,000+ patients who stopped waiting and started healing.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl font-bold" asChild>
                <Link to="/auth?mode=signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2 font-semibold" asChild>
                <Link to="/search">Browse Specialists</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              ✓ No credit card required ✓ See specialists in minutes ✓ Cancel anytime
            </p>
          </div>
        </section>
    </Layout>
  );
}
