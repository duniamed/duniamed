import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, Calendar, Video, FileText, Heart, Shield, Globe, Clock, Star, MessageSquare, Users, Bot } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForPatients() {
  const features = [
    {
      icon: Search,
      title: "Find the Right Specialist",
      description: "Search 10,000+ verified specialists across 100+ specialties worldwide",
      details: ["Advanced filters", "Real reviews", "Instant availability", "Multiple languages"]
    },
    {
      icon: Bot,
      title: "AI Symptom Checker",
      description: "Get instant triage and specialist recommendations",
      details: ["Multi-step assessment", "Urgency detection", "Smart matching", "24/7 available"]
    },
    {
      icon: Calendar,
      title: "Easy Booking",
      description: "Book appointments instantly at your convenience",
      details: ["Real-time scheduling", "Automatic reminders", "Easy rescheduling", "No waiting rooms"]
    },
    {
      icon: Video,
      title: "HD Video Consultations",
      description: "HIPAA-compliant video calls from anywhere",
      details: ["Browser-based", "Screen sharing", "Secure chat", "Recording available"]
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Access all your health information in one place",
      details: ["FHIR compliant", "Timeline view", "Easy sharing", "Lifetime storage"]
    },
    {
      icon: Heart,
      title: "Prescription Management",
      description: "Digital prescriptions delivered instantly",
      details: ["Cross-border support", "Refill reminders", "Pharmacy routing", "Drug interactions"]
    },
    {
      icon: MessageSquare,
      title: "Secure Messaging",
      description: "Chat with your doctors anytime",
      details: ["End-to-end encryption", "File sharing", "Quick responses", "Message history"]
    },
    {
      icon: Users,
      title: "Family Accounts",
      description: "Manage healthcare for your whole family",
      details: ["Multiple profiles", "Proxy access", "Age restrictions", "Shared records"]
    },
    {
      icon: Star,
      title: "Favorite Doctors",
      description: "Quick access to your trusted specialists",
      details: ["One-click booking", "Online status", "Availability alerts", "Priority scheduling"]
    },
    {
      icon: Globe,
      title: "Cross-Border Care",
      description: "Get treatment from specialists anywhere",
      details: ["150+ countries", "Local validation", "Currency support", "Time zone aware"]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your data is encrypted and protected",
      details: ["HIPAA/GDPR compliant", "2FA security", "Audit logs", "Data export"]
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Help whenever you need it",
      details: ["Live chat", "Email support", "Help center", "Multiple languages"]
    }
  ];

  const howItWorks = [
    "Create your free account",
    "Search or use AI symptom checker",
    "Book appointment with specialist",
    "Join video consultation",
    "Receive prescription & care plan"
  ];

  return (
    <Layout>
        {/* Hero - Clean and Modern */}
        <section className="section-padding bg-white dark:bg-background">
          <div className="container-modern">
            <div className="text-center max-w-4xl mx-auto space-y-10">
              {/* Trust Badge */}
              <Badge className="inline-flex items-center gap-2.5 px-6 py-3 bg-green-50 dark:bg-green-500/10 border-0 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                10,000+ patients helped today
              </Badge>
              
              <div className="space-y-6">
                <h1 className="font-display">
                  Healthcare That
                  <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mt-2">
                    Doesn't Make You Wait
                  </span>
                </h1>
                <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                  See top specialists in minutes, not months. From $0-79 vs $800-2000 ER costs.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 font-semibold shadow-xl" asChild>
                  <Link to="/auth?mode=signup&role=patient">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2 font-semibold" asChild>
                  <Link to="/search">Browse Specialists</Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <div className="text-green-600 text-xs">✓</div>
                  </div>
                  No subscription
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <div className="text-green-600 text-xs">✓</div>
                  </div>
                  Insurance accepted
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <div className="text-green-600 text-xs">✓</div>
                  </div>
                  Risk-free trial
                </span>
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20">
              {[
                { number: "500K+", label: "Patients treated", color: "text-primary" },
                { number: "4.9★", label: "Average rating", color: "text-yellow-500" },
                { number: "<5min", label: "Average wait", color: "text-green-600" },
                { number: "$0-79", label: "Typical cost", color: "text-blue-600" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-5xl md:text-6xl font-bold ${stat.color} mb-3`}>{stat.number}</div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid - Modern & Clean */}
        <section className="section-padding bg-[hsl(var(--soft-blue))]">
          <div className="container-modern">
            <div className="text-center mb-20">
              <h2 className="mb-6 font-display">Everything You Need in One Place</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Comprehensive healthcare platform built for modern patients
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="card-modern group">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2.5">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2.5 text-sm">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="text-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing with Anchoring */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Stop overpaying for healthcare</h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Why waste money on expensive ER visits? Get quality care at fraction of the cost.
              </p>
            </div>
            
            <Card className="p-8 md:p-12 border-2">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Traditional ER Visit</p>
                  <p className="text-4xl font-bold text-destructive line-through">$800-2,000</p>
                  <p className="text-sm text-muted-foreground">4+ hour wait</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-12 w-px bg-border" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-primary uppercase tracking-wide font-semibold">Our Platform</p>
                  <p className="text-4xl font-bold text-primary">$0-79</p>
                  <p className="text-sm font-medium">Under 5 min wait</p>
                </div>
              </div>
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">No subscription fees. Pay only when you need care.</p>
                <Button size="lg" asChild>
                  <Link to="/search">Find Your Specialist</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <div className="text-center space-y-6">
                <Badge className="urgency-badge">
                  <Clock className="h-3.5 w-3.5" />
                  Your health can't wait - Act now
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Don't risk delaying care</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Every day you wait, your condition could worsen. Join 500,000+ patients who chose better healthcare.
                </p>
                <Button size="lg" className="h-14 px-10 text-base shadow-lg" asChild>
                  <Link to="/auth?mode=signup&role=patient">Get Started Free Now</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✓ Cancel anytime ✓ Money-back guarantee ✓ HIPAA compliant
                </p>
              </div>
            </Card>
          </div>
        </section>
    </Layout>
  );
}