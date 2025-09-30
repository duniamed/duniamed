import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Calendar, BarChart3, Shield, Globe, Zap, DollarSign } from "lucide-react";
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
      
      <main className="flex-1 pt-24">
        {/* Hero */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-hero">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="mb-6">Scale Your <span className="text-primary">Clinic</span> Globally</h1>
              <p className="text-xl text-muted-foreground mb-8">
                All-in-one platform for virtual and physical clinics. 
                Manage your team, patients, and revenue from a single dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/how-it-works">See Demo</Link>
                </Button>
              </div>
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

        {/* Pricing */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">
                Choose the plan that fits your clinic size
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card key={plan.name} className={`p-8 ${plan.popular ? 'border-primary shadow-primary' : ''}`}>
                  {plan.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-center text-primary mb-6">{plan.price}</div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/auth?mode=signup&role=clinic_admin">
                      {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              All plans include 14-day free trial | No credit card required | Cancel anytime
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to Transform Your Clinic?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of clinics already using DUNIAMED
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup&role=clinic_admin">Start Free Trial</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}