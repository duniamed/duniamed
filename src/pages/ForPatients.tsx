import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, Calendar, Video, FileText, Heart, Shield, Globe, Clock, Star, MessageSquare, Users, Bot } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-6">
              {/* Urgency Badge */}
              <div className="flex justify-center gap-3 mb-6">
                <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  10,000+ patients helped today
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Don't risk your health - 
                <span className="block text-primary mt-2">Get care that actually works</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Stop waiting weeks for appointments. Stop worrying about rising medical costs. 
                <span className="font-semibold text-foreground"> Access world-class specialists immediately - before your condition worsens.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-14 text-base shadow-lg shadow-primary/25" asChild>
                  <Link to="/auth?mode=signup&role=patient">Start Free - Don't Wait</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 text-base border-2" asChild>
                  <Link to="/search">Browse Specialists</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ✓ No subscription fees ✓ Most insurance accepted ✓ First consultation risk-free
              </p>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { number: "500K+", label: "Patients treated" },
                { number: "4.9★", label: "Avg rating" },
                { number: "&lt;5min", label: "Avg wait time" },
                { number: "$0-79", label: "Typical cost" }
              ].map((stat) => (
                <Card key={stat.label} className="p-6 text-center border-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">
                Comprehensive features for complete healthcare management
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 hover:shadow-xl transition-shadow">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </Card>
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
      </main>

      <Footer />
    </div>
  );
}