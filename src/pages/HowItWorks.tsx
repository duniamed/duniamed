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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative mx-auto max-w-4xl text-center space-y-6">
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
              <Users className="h-3.5 w-3.5" />
              50,000+ patients used this process this month
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Stop wasting time on healthcare
              <span className="block text-primary mt-2">Get care in 4 simple steps</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Why spend hours in waiting rooms when you can see a specialist in minutes? 
              <span className="font-semibold text-foreground"> Every delay risks your health.</span>
            </p>
            
            {/* Cost Comparison */}
            <Card className="max-w-xl mx-auto p-6 bg-gradient-to-r from-destructive/5 to-transparent border-l-4 border-destructive">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold text-foreground mb-1">Traditional healthcare costs you:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 2-4 weeks wait time for specialists</li>
                    <li>• 1-3 hours in waiting rooms</li>
                    <li>• $800-2,000 for ER visits</li>
                    <li>• Time off work and commute costs</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Steps with Urgency */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-20">
              {steps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className={`md:w-1/2 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                      <Card className="p-8 hover:shadow-2xl transition-all border-2 hover:border-primary/30 group">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border-2 border-primary/20">
                              <step.icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-primary font-semibold mb-1">Step {index + 1}</div>
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{step.title}</h3>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-6 text-lg">{step.description}</p>
                        
                        {/* Urgency Badge */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-500">{step.urgency}</span>
                          </div>
                        </div>
                        
                        <ul className="space-y-3">
                          {step.details.map((detail) => (
                            <li key={detail} className="flex items-start gap-3">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm text-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                    <div className={`md:w-1/2 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl flex items-center justify-center border-2 border-primary/10">
                        <step.icon className="h-32 w-32 text-primary/20" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-1/2 h-20 w-0.5 bg-gradient-to-b from-primary/30 to-transparent mt-10 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Time Comparison */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop wasting precious time</h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                See how much time you're losing with traditional healthcare
              </p>
            </div>
            
            <Card className="p-8 md:p-12 border-2">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Traditional Healthcare</p>
                    <p className="text-5xl font-bold text-destructive mb-4">2-4 weeks</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Call clinic during business hours",
                      "Wait for callback (1-2 days)",
                      "Schedule appointment (2-4 weeks out)",
                      "Take time off work",
                      "Drive to clinic (30-60 min)",
                      "Sit in waiting room (30-90 min)",
                      "See doctor (15 min)",
                      "Wait for prescription (1-2 days)"
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-primary uppercase tracking-wide mb-2 font-semibold">Our Platform</p>
                    <p className="text-5xl font-bold text-primary mb-4">&lt;5 min</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Search specialists (30 seconds)",
                      "Book appointment instantly",
                      "Join from home/office",
                      "No commute needed",
                      "No waiting room",
                      "See doctor immediately",
                      "Receive prescription instantly",
                      "Access records forever"
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
                  Don't let another day pass in pain
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Your health can't wait</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Every day you delay is a day of unnecessary suffering. Join 500,000+ patients who stopped waiting.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="h-14 px-10 text-base shadow-lg shadow-primary/25" asChild>
                    <Link to="/auth?mode=signup">Get Started Free Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2" asChild>
                    <Link to="/search">Browse Specialists</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  ✓ No setup fees ✓ Cancel anytime ✓ Money-back guarantee
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