import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="mb-6">Healthcare Made <span className="text-primary">Simple</span></h1>
              <p className="text-xl text-muted-foreground mb-8">
                Access world-class healthcare from the comfort of your home. 
                Connect with verified specialists, manage your health records, and get care on your terms.
              </p>
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup&role=patient">Get Started Free</Link>
              </Button>
            </div>

            {/* How It Works - Quick */}
            <Card className="p-8 max-w-4xl mx-auto">
              <h3 className="text-center mb-8">How It Works</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {howItWorks.map((step, index) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                        {index + 1}
                      </div>
                      <p className="text-sm text-center">{step}</p>
                    </div>
                    {index < howItWorks.length - 1 && (
                      <div className="hidden md:block h-0.5 w-8 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
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

        {/* Pricing Preview */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground mb-8">
              No subscription fees. Pay only for consultations you book.
              Prices set by specialists, typically $30-150 per consultation.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">Browse Specialists</Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to Take Control of Your Health?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of patients already using DUNIAMED
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup&role=patient">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}