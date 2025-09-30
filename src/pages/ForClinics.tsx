import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Building2, Users, Calendar, BarChart3, Shield, Globe, Zap, DollarSign, Clock, AlertCircle, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ForClinics() {
  const features = [
    {
      icon: Building2,
      title: "Virtual & Physical Clinics",
      description: "Manage both online and in-person operations seamlessly",
      benefits: ["Unified platform", "Flexible workflows", "Hybrid support", "Multi-location"]
    },
    {
      icon: Users,
      title: "Multi-Doctor Management",
      description: "Collaborate with multiple specialists under one roof",
      benefits: ["Team scheduling", "Revenue splits", "Role permissions", "Staff management"]
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-optimized appointment distribution across your team",
      benefits: ["Auto-assignment", "Load balancing", "Room allocation", "Queue management"]
    },
    {
      icon: BarChart3,
      title: "Financial Dashboard",
      description: "Real-time revenue tracking and comprehensive reporting",
      benefits: ["Revenue analytics", "Per-doctor breakdown", "Expense tracking", "Tax reports"]
    },
    {
      icon: Shield,
      title: "Compliance Management",
      description: "Stay compliant with automated tracking and reporting",
      benefits: ["Credential tracking", "Audit logs", "Incident reports", "License monitoring"]
    },
    {
      icon: Globe,
      title: "Patient Management",
      description: "Complete patient records and communication system",
      benefits: ["Unified records", "Secure messaging", "Appointment history", "Billing integration"]
    },
    {
      icon: Zap,
      title: "Automation Tools",
      description: "Reduce administrative burden with smart automation",
      benefits: ["Auto-reminders", "Follow-up scheduling", "Billing automation", "Report generation"]
    },
    {
      icon: DollarSign,
      title: "Revenue Optimization",
      description: "Maximize earnings with intelligent pricing and scheduling",
      benefits: ["Dynamic pricing", "Utilization reports", "Performance metrics", "Growth insights"]
    }
  ];

  const plans = [
    {
      name: "Basic",
      price: "$99/month",
      features: [
        "Up to 3 specialists",
        "500 appointments/month",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: "$299/month",
      features: [
        "Up to 10 specialists",
        "2,000 appointments/month",
        "Advanced analytics",
        "Priority support",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited specialists",
        "Unlimited appointments",
        "Custom integrations",
        "Dedicated support",
        "White-label option"
      ]
    }
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
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20">
                <Building2 className="h-3.5 w-3.5" />
                500+ clinics scaled globally with us
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Stop losing patients to competitors
                <span className="block text-primary mt-2">Scale your clinic globally</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Every day without digital tools, you're losing patients to modern clinics. Competitors are capturing YOUR potential patients online. 
                <span className="font-semibold text-foreground"> Don't get left behind.</span>
              </p>
              
              {/* Loss Indicators */}
              <Card className="max-w-2xl mx-auto p-6 bg-destructive/5 border-l-4 border-destructive">
                <div className="space-y-3 text-left">
                  <p className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    What you're losing monthly without our platform:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                    <li>• 30-50% of potential patients go to digital competitors</li>
                    <li>• $10K-50K in revenue from missed appointments</li>
                    <li>• 20+ hours/week on manual scheduling</li>
                    <li>• Global patient base (150+ countries)</li>
                  </ul>
                </div>
              </Card>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="h-14 text-base shadow-lg shadow-primary/25" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Start Free 14-Day Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 text-base border-2" asChild>
                  <Link to="#roi">Calculate Your ROI</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ✓ No credit card required ✓ Setup in 48 hours ✓ Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Perfect For</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Virtual Clinics</h3>
                <p className="text-muted-foreground mb-6">
                  Run a fully online practice with multiple specialists collaborating globally
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Global patient reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Zero physical overhead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">24/7 availability</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-primary shadow-primary">
                <h3 className="text-2xl font-semibold mb-4">Physical Clinics</h3>
                <p className="text-muted-foreground mb-6">
                  Modernize your brick-and-mortar practice with digital tools
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Digital check-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Room scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Inventory management</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8">
                <h3 className="text-2xl font-semibold mb-4">Hybrid Clinics</h3>
                <p className="text-muted-foreground mb-6">
                  Best of both worlds - offer in-person and online consultations
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Flexible scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Unified records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Maximize capacity</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Complete Clinic Management</h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to run a modern healthcare practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 hover:shadow-xl transition-shadow">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="text-xs text-muted-foreground flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing with Anchoring */}
        <section id="roi" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Stop overpaying for outdated systems</h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                See how much you'll save vs. traditional clinic management software
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={plan.name} className={`p-8 relative overflow-hidden ${
                  plan.popular ? 'border-2 border-primary shadow-xl scale-105' : 'border-2'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-lg">
                      Most Popular - Save 40%
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="space-y-2">
                      {plan.price !== "Custom" && (
                        <p className="text-sm text-muted-foreground line-through">
                          ${parseInt(plan.price.replace(/\D/g, '')) * 2}/month
                        </p>
                      )}
                      <div className="text-4xl font-bold text-primary">{plan.price}</div>
                      {plan.price !== "Custom" && (
                        <p className="text-xs text-muted-foreground">vs. $600-1,200 traditional systems</p>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DollarSign className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full h-12" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/auth?mode=signup&role=clinic_admin">
                      {plan.price === "Custom" ? "Contact Sales" : "Start 14-Day Free Trial"}
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                All plans: 14-day free trial | No credit card required | Cancel anytime
              </p>
              <Card className="max-w-2xl mx-auto p-6 bg-yellow-500/10 border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-1">ROI Guarantee:</p>
                    <p className="text-sm text-muted-foreground">Average clinic sees 3x ROI in first 6 months or full refund</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA with Loss Aversion */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <div className="text-center space-y-6">
                <Badge className="urgency-badge">
                  <Clock className="h-3.5 w-3.5" />
                  15 clinics joined this week - Don't fall behind
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Every month you wait costs you $10K+</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  While you hesitate, competitors are capturing your patients online. 
                  <span className="font-semibold text-foreground"> Act now before it's too late.</span>
                </p>
                <Button size="lg" className="h-14 px-10 text-base shadow-lg shadow-primary/25" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Start Free Trial - No Risk</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  ✓ 14-day free trial ✓ No credit card ✓ Setup in 48h ✓ 3x ROI guaranteed
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