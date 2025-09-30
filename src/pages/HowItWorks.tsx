import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, Calendar, Video, FileText, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Find Your Specialist",
      description: "Search through 10,000+ verified specialists across 100+ specialties worldwide",
      details: [
        "Filter by specialty, language, location, and price",
        "View detailed profiles with credentials and reviews",
        "Check real-time availability",
        "AI-powered symptom checker suggests best specialists"
      ]
    },
    {
      icon: Calendar,
      title: "Book Appointment",
      description: "Schedule your consultation at a time that works for you",
      details: [
        "Instant booking with automatic confirmation",
        "Flexible scheduling 24/7",
        "Multiple payment options",
        "Receive automated reminders via email/SMS"
      ]
    },
    {
      icon: Video,
      title: "Join Video Consultation",
      description: "Connect with your specialist via secure HD video call",
      details: [
        "HIPAA-compliant encrypted video",
        "No downloads required - works in browser",
        "Screen sharing for medical images",
        "Real-time chat and file sharing"
      ]
    },
    {
      icon: FileText,
      title: "Receive Care",
      description: "Get your diagnosis, prescription, and follow-up plan",
      details: [
        "Digital prescriptions sent instantly",
        "Access SOAP notes and medical records",
        "Cross-border prescription validation",
        "Schedule follow-ups seamlessly"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6">How DUNIAMED Works</h1>
            <p className="text-xl text-muted-foreground">
              Get expert medical care in 4 simple steps
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="space-y-16">
              {steps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className={`md:w-1/2 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                      <Card className="p-8 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <step.icon className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm text-primary font-semibold mb-1">Step {index + 1}</div>
                            <h3 className="text-2xl font-bold">{step.title}</h3>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-6">{step.description}</p>
                        <ul className="space-y-3">
                          {step.details.map((detail) => (
                            <li key={detail} className="flex items-start gap-2">
                              <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                    <div className={`md:w-1/2 ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <step.icon className="h-24 w-24 text-muted-foreground/20" />
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-1/2 h-16 w-0.5 bg-border mt-8 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">
                Comprehensive features for complete healthcare management
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "AI Symptom Checker",
                "Medical Records Storage",
                "Prescription Management",
                "Secure Messaging",
                "Family Account Management",
                "Multi-Language Support",
                "Cross-Border Care",
                "HIPAA/GDPR Compliant",
                "24/7 Support"
              ].map((feature) => (
                <Card key={feature} className="p-6">
                  <p className="font-semibold">{feature}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands already experiencing better healthcare
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}