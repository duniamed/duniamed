import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Stethoscope, Globe, Calendar, Video, FileText, Shield, CheckCircle2, TrendingUp, Clock, DollarSign } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForSpecialists() {
  return (
    <Layout>
      {/* Hero Section - Modern Startup */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-soft-purple/30 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="section-padding">
          <div className="container-modern">
            <div className="max-w-5xl mx-auto text-center space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  AI-Powered Healthcare Platform
                </div>
                
                <h1 className="font-display leading-[1.1]">
                  Turn Your Expertise Into
                  <span className="block gradient-text mt-2">Global Impact</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Join 10,000+ specialists earning more while helping patients worldwide. AI handles documentation, you focus on care.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-16 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Start Earning Today</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2" asChild>
                  <Link to="/contact">Book Demo</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground pt-4">
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  Free to start
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  24/7 support
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20">
              {[
                { value: "$12K", label: "Avg monthly earnings", color: "text-primary" },
                { value: "250%", label: "Productivity increase", color: "text-green-600" },
                { value: "38hrs", label: "Saved per month", color: "text-blue-600" },
                { value: "4.9★", label: "Doctor rating", color: "text-yellow-500" }
              ].map((stat) => (
                <div key={stat.label} className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all">
                  <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container-modern">
          <div className="text-center mb-20 space-y-4">
            <h2>Get Started in Minutes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of doctors who've automated their practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                icon: Video,
                title: "Create Your Profile",
                description: "Set up in 5 minutes. Add credentials, specialties, and availability."
              },
              {
                step: "2",
                icon: Stethoscope,
                title: "Go Live & Treat Patients",
                description: "See patients globally via video. AI generates notes automatically."
              },
              {
                step: "3",
                icon: DollarSign,
                title: "Get Paid Weekly",
                description: "Automatic payments to your account. Track earnings in real-time."
              }
            ].map((item) => (
              <div key={item.step} className="relative card-modern group">
                <div className="absolute -top-4 left-8 h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="pt-6 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="section-padding">
        <div className="container-modern">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-12">
              <div className="text-center mb-12">
                <h2 className="mb-4">Stop Losing Money on Paperwork</h2>
                <p className="text-xl text-muted-foreground">
                  Doctors waste 38 hours/month on documentation. That's $8,000+ in lost revenue.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Clock,
                    value: "38 hrs",
                    label: "saved per month",
                    color: "text-blue-600"
                  },
                  {
                    icon: DollarSign,
                    value: "$8K+",
                    label: "recovered monthly",
                    color: "text-green-600"
                  },
                  {
                    icon: TrendingUp,
                    value: "250%",
                    label: "productivity boost",
                    color: "text-purple-600"
                  }
                ].map((stat) => (
                  <div key={stat.label} className="text-center space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-card flex items-center justify-center mx-auto shadow-lg">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding bg-gradient-to-b from-muted/30 to-background">
        <div className="container-modern">
          <div className="text-center mb-20 space-y-4">
            <h2>Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform built for modern healthcare professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "AI Medical Scribe",
                description: "Real-time transcription and SOAP notes generated automatically during consultations.",
                badge: "AI-Powered"
              },
              {
                icon: FileText,
                title: "Smart Documentation",
                description: "AI structures your notes following international standards. Edit and export easily.",
                badge: "Time Saver"
              },
              {
                icon: Globe,
                title: "Global Patient Access",
                description: "Treat patients worldwide via secure HD video. Built-in translation for 40+ languages.",
                badge: "Worldwide"
              },
              {
                icon: Calendar,
                title: "Intelligent Scheduling",
                description: "AI optimizes your calendar. Sync with Google/Outlook. Automated reminders.",
                badge: "Smart"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "HIPAA/GDPR compliant. End-to-end encryption. SOC 2 certified infrastructure.",
                badge: "Secure"
              },
              {
                icon: DollarSign,
                title: "Instant Payments",
                description: "Get paid within 24 hours. Multi-currency support. Automated billing & invoicing.",
                badge: "Fast Money"
              }
            ].map((feature) => (
              <div key={feature.title} className="card-modern group relative overflow-hidden">
                <div className="absolute top-6 right-6">
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {feature.badge}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="container-modern relative">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-12 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Join 10,000+ specialists earning more
              </div>
              
              <h2>Ready to Transform Your Practice?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start earning more while working less. AI handles the paperwork, you focus on what matters.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2" asChild>
                  <Link to="/contact">Schedule Demo</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground pt-4">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
