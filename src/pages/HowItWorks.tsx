import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, Calendar, Video, FileText, ArrowRight, Clock, CheckCircle2, AlertCircle, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Find Your Specialist",
      description: "Don't waste time with wrong doctors - Find the perfect specialist instantly",
      details: [
        "AI matches you with specialists in seconds",
        "View verified credentials and real patient reviews",
        "See who's available right now - no waiting",
        "Filter by price to avoid overpaying"
      ],
      urgency: "Most patients find a match in under 2 minutes"
    },
    {
      icon: Calendar,
      title: "Book Immediately",
      description: "Stop waiting weeks for appointments - Get seen today",
      details: [
        "Instant confirmation - no phone calls needed",
        "Book 24/7 at your convenience",
        "Cancel free up to 24h before (no penalty)",
        "Automated reminders so you never miss"
      ],
      urgency: "Average booking time: 90 seconds"
    },
    {
      icon: Video,
      title: "Connect Securely",
      description: "No commute, no waiting room, no wasted time",
      details: [
        "100% HIPAA-compliant encrypted video",
        "Works in browser - no app downloads",
        "Share medical images instantly",
        "Record consultation for later review"
      ],
      urgency: "Join from anywhere in 1 click"
    },
    {
      icon: FileText,
      title: "Get Results Fast",
      description: "Don't wait days for prescriptions - Get everything instantly",
      details: [
        "Digital prescriptions delivered in minutes",
        "All medical records accessible forever",
        "International prescription validation",
        "Easy follow-ups with same doctor"
      ],
      urgency: "Prescriptions ready before consultation ends"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--soft-blue))]">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero with Loss Aversion */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background">
          <div className="mx-auto max-w-5xl text-center space-y-8">
            <Badge className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-500/10 border-0 text-green-700 dark:text-green-400 rounded-full font-medium">
              <Users className="h-4 w-4" />
              50,000+ patients this month
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Healthcare in
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mt-2">4 Simple Steps</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop wasting hours in waiting rooms. See a specialist in minutes.
            </p>
            
            {/* Cost Comparison */}
            <div className="card-soft max-w-2xl mx-auto p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-lg text-foreground mb-3">Traditional healthcare wastes:</p>
                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div>⏱️ 2-4 weeks waiting</div>
                    <div>🏥 1-3 hours in clinic</div>
                    <div>💰 $800-2,000 ER costs</div>
                    <div>🚗 Commute + time off</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps with Urgency */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--soft-blue))]">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={step.title} className="card-modern group hover:scale-105 transition-transform">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[hsl(var(--accent-yellow))] to-[hsl(var(--accent-yellow))]/60 flex items-center justify-center shadow-lg">
                      <step.icon className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-2 -right-2 h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{step.description}</p>
                  
                  {/* Urgency Badge */}
                  <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl px-4 py-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-500">{step.urgency}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Time Comparison */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Time is Money. Save Both.</h2>
              <p className="text-xl text-muted-foreground">
                Traditional healthcare wastes your most valuable resource
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card-soft bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20">
                <div className="text-center mb-8">
                  <p className="text-sm text-red-600 dark:text-red-400 uppercase tracking-wider font-bold mb-3">Old Way</p>
                  <p className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">2-4 weeks</p>
                  <p className="text-sm text-muted-foreground">Average wait time</p>
                </div>
                <ul className="space-y-4">
                  {[
                    "Call during business hours",
                    "Wait 1-2 days for callback",
                    "Schedule weeks ahead",
                    "Take time off work",
                    "30-60 min commute",
                    "30-90 min waiting room",
                    "15 min actual care",
                    "Wait days for prescription"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="card-soft bg-green-50/50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20">
                <div className="text-center mb-8">
                  <p className="text-sm text-green-600 dark:text-green-400 uppercase tracking-wider font-bold mb-3">Our Platform</p>
                  <p className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">&lt;5 min</p>
                  <p className="text-sm text-muted-foreground">From search to care</p>
                </div>
                <ul className="space-y-4">
                  {[
                    "Search instantly (30 sec)",
                    "Book immediately",
                    "Join from anywhere",
                    "Zero commute time",
                    "Zero waiting room",
                    "Immediate care start",
                    "Instant prescription",
                    "Lifetime record access"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA with Loss Aversion */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-[hsl(var(--soft-blue))]">
          <div className="mx-auto max-w-4xl">
            <div className="card-modern text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/10">
              <Badge className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 border-0 text-red-700 dark:text-red-400 rounded-full font-semibold mb-6">
                <Clock className="h-4 w-4" />
                Don't let another day pass in pain
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Your Health Can't Wait</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Every day you delay is unnecessary suffering. Join 500,000+ patients who stopped waiting.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
                <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow))]/90 text-[hsl(var(--accent-yellow-foreground))] shadow-xl font-bold" asChild>
                  <Link to="/auth?mode=signup">Get Started Free Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl border-2 font-semibold" asChild>
                  <Link to="/search">Browse Specialists</Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  No setup fees
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Money-back guarantee
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}