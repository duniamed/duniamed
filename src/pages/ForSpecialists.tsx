import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Globe, DollarSign, Calendar, Users, FileText, BarChart3, Shield, Bot, Video, Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ForSpecialists() {
  const benefits = [
    {
      icon: Globe,
      title: "Global Patient Reach",
      description: "Access patients from 150+ countries seeking your expertise",
      stats: "10x patient base"
    },
    {
      icon: DollarSign,
      title: "Set Your Own Fees",
      description: "Complete control over pricing and availability",
      stats: "$150+ avg/consultation"
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Work on your terms with smart calendar management",
      stats: "50% time savings"
    },
    {
      icon: Bot,
      title: "AI-Powered Documentation",
      description: "Auto-generate SOAP notes from consultation transcripts",
      stats: "80% faster notes"
    },
    {
      icon: Users,
      title: "Patient Management",
      description: "Complete patient records and history at your fingertips",
      stats: "All-in-one platform"
    },
    {
      icon: FileText,
      title: "E-Prescribing",
      description: "Digital prescriptions with drug interaction checking",
      stats: "Instant delivery"
    },
    {
      icon: BarChart3,
      title: "Earnings Dashboard",
      description: "Real-time revenue tracking and payout management",
      stats: "Weekly payouts"
    },
    {
      icon: Shield,
      title: "Full Compliance",
      description: "HIPAA/GDPR compliant with complete audit trails",
      stats: "100% secure"
    },
    {
      icon: Video,
      title: "HD Video Platform",
      description: "Professional consultation room with screen sharing",
      stats: "No downloads"
    },
    {
      icon: Zap,
      title: "Fast Onboarding",
      description: "Get verified and start seeing patients in 48 hours",
      stats: "2-day setup"
    }
  ];

  const earnings = [
    { consultations: 10, monthly: "$1,200", annual: "$14,400" },
    { consultations: 20, monthly: "$2,400", annual: "$28,800" },
    { consultations: 40, monthly: "$4,800", annual: "$57,600" },
    { consultations: 60, monthly: "$7,200", annual: "$86,400" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24">
        {/* Hero with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
          
          <div className="relative mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* Social Proof */}
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20">
                <Users className="h-3.5 w-3.5" />
                10,000+ specialists earning globally
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Stop limiting your practice
                <span className="block text-primary mt-2">Expand globally today</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Every day you wait is lost income. While you're limited to local patients, competitors are earning $50K+ extra annually from global telemedicine. 
                <span className="font-semibold text-foreground"> Don't miss out.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-xl hover:shadow-2xl transition-all" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-2" asChild>
                  <Link to="#earnings">888 (492) 5488</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Earnings Calculator with Anchoring */}
        <section id="earnings" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Don't leave money on the table</h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                See what you're missing by not joining (based on $120/consultation - you set your own fees)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {earnings.map((tier, index) => (
                <Card 
                  key={tier.consultations} 
                  className={`p-8 hover:shadow-2xl transition-all ${
                    index === 2 ? 'border-2 border-primary shadow-xl scale-105' : ''
                  }`}
                >
                  {index === 2 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <div className="text-5xl font-bold text-primary">
                        {tier.consultations}
                      </div>
                      <p className="text-sm text-muted-foreground">consultations/month</p>
                      <p className="text-xs text-muted-foreground">({Math.round(tier.consultations/20)} per day)</p>
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <div className="text-3xl font-bold text-primary">{tier.monthly}</div>
                        <p className="text-sm text-muted-foreground">extra per month</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="text-2xl font-bold">{tier.annual}</div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Lost yearly income</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Platform fee: 15% | Weekly payouts | No subscription | You keep 85% of earnings
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="font-semibold text-destructive mb-2">Cost of waiting:</p>
                <p className="text-muted-foreground">Every month you delay = $2,400-$7,200 in lost income. That's a vacation, car payment, or college fund.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Why Specialists Choose DUNIAMED</h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to deliver excellent care and grow your practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="p-6 hover:shadow-xl transition-shadow">
                  <benefit.icon className="h-10 w-10 text-primary mb-4" />
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                      {benefit.stats}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How to Join */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center mb-12">Simple Onboarding Process</h2>
            <div className="space-y-6">
              {[
                { step: 1, title: "Apply", description: "Submit your credentials and medical license" },
                { step: 2, title: "Verification", description: "We verify your credentials (24-48 hours)" },
                { step: 3, title: "Setup Profile", description: "Complete your profile and set availability" },
                { step: 4, title: "Start Practicing", description: "Begin accepting appointments and earning" }
              ].map((item) => (
                <Card key={item.step} className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <div className="text-center space-y-6">
                <Badge className="urgency-badge">
                  <Calendar className="h-3.5 w-3.5" />
                  100+ specialists joined this week
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Stop losing patients to competitors</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  While you wait, thousands of patients are finding specialists on our platform. 
                  <span className="font-semibold text-foreground"> Don't let them choose someone else.</span>
                </p>
                <Button size="lg" className="h-14 px-10 text-base shadow-lg shadow-primary/25" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Join Now - Free Setup</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✓ No setup fees ✓ 48-hour verification ✓ Start earning immediately
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