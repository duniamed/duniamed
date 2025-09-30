import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="mb-6">Expand Your <span className="text-primary">Practice</span> Globally</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join 10,000+ verified specialists providing care worldwide. 
                Increase your income, reach more patients, and practice on your terms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Apply Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="mb-4">Your Earning Potential</h2>
              <p className="text-xl text-muted-foreground">
                Based on average $120 per consultation (you set your own fees)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {earnings.map((tier) => (
                <Card key={tier.consultations} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {tier.consultations}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">consultations/month</p>
                    <div className="space-y-2">
                      <div>
                        <div className="text-2xl font-bold">{tier.monthly}</div>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-lg font-semibold text-primary">{tier.annual}</div>
                        <p className="text-xs text-muted-foreground">per year</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Platform fee: 15% | Weekly automatic payouts | No subscription fees
            </p>
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

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to Grow Your Practice?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of specialists already on DUNIAMED
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup&role=specialist">Apply as Specialist</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}