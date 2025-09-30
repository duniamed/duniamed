import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Clock, 
  Shield, 
  Calendar,
  Stethoscope,
  CheckCircle2,
  ArrowDown,
  AlertCircle,
  Users,
  Award,
  TrendingUp
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const services = [
    {
      icon: Stethoscope,
      title: "Urgent Care",
      description: "24/7 online doctors for immediate medical needs",
      conditions: ["Cold & flu", "Infections", "Allergies", "Minor injuries"]
    },
    {
      icon: Video,
      title: "Mental Health",
      description: "Licensed therapists and psychiatrists available",
      conditions: ["Anxiety", "Depression", "Stress", "Counseling"]
    },
    {
      icon: Calendar,
      title: "Primary Care",
      description: "Ongoing care and chronic condition management",
      conditions: ["Check-ups", "Prescriptions", "Lab orders", "Referrals"]
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Choose your care",
      description: "Select the type of medical care you need"
    },
    {
      step: "2",
      title: "Connect instantly",
      description: "See a doctor via video in minutes or schedule ahead"
    },
    {
      step: "3",
      title: "Get treatment",
      description: "Receive diagnosis, prescriptions, and follow-up care"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Loss Aversion & Urgency */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          
          <div className="relative mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                {/* Urgency & Scarcity Indicator */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge className="urgency-badge">
                    <Clock className="h-3.5 w-3.5" />
                    Doctors available now
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    12,847 patients helped this week
                  </Badge>
                </div>
                
                {/* Loss Aversion Framing */}
                <h1 className="text-balance mb-6 leading-tight">
                  Don't let health issues wait - See a doctor in minutes
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-6 leading-relaxed">
                  Delaying care can turn minor issues into serious problems. Get immediate access to board-certified doctors 24/7.
                </p>
                
                {/* Risk Reduction - What they might lose */}
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-8">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive mb-1">Why wait and risk it?</p>
                      <p className="text-sm text-muted-foreground">Most conditions worsen without timely treatment. Average wait times at urgent care: 2-4 hours. Here? Under 5 minutes.</p>
                    </div>
                  </div>
                </div>
                
                {/* Anchored CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg h-14 px-8 shadow-lg" asChild>
                    <Link to="/instant-consultation">
                      Get Care Now - From $0
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                    <Link to="#how-it-works">
                      See how it works
                      <ArrowDown className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Indicators - Loss Prevention */}
                <div className="flex flex-wrap gap-6 mt-6 text-sm">
                  <div className="trust-indicator">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Most insurance = $0 copay</span>
                  </div>
                  <div className="trust-indicator">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>100% secure & HIPAA compliant</span>
                  </div>
                  <div className="trust-indicator">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Board-certified doctors only</span>
                  </div>
                </div>
              </div>
              
              <div className="relative lg:block">
                <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <Video className="w-32 h-32 text-primary opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section - Benefit Framing */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="mb-4">Stop suffering - Get help for any condition</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Why endure discomfort when relief is just minutes away? Board-certified specialists ready to help.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={service.title} className="benefit-card p-8 border-2">
                  {index === 0 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6">{service.description}</p>
                  
                  {/* Anchoring - Show starting price */}
                  <div className="bg-primary/5 rounded-lg p-3 mb-4">
                    <p className="text-sm text-muted-foreground">Typical visit</p>
                    <p className="text-2xl font-bold text-primary">$0 - $79</p>
                    <p className="text-xs text-muted-foreground">With insurance usually $0</p>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {service.conditions.map((condition) => (
                      <li key={condition} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={index === 0 ? "default" : "outline"}>
                    <Link to="/search">Get Help Now</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">How it works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the care you need in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {howItWorks.map((item, index) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6 text-3xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link to="/instant-consultation">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section - Social Proof & Risk Reduction */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-white mb-3">Don't risk waiting - Join thousands who chose better care</h2>
              <p className="text-primary-foreground/80 text-lg">Your health is too important to compromise on</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50K+</div>
                <p className="text-primary-foreground/80">Patients treated monthly</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">4.9★</div>
                <p className="text-primary-foreground/80">Average rating</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">&lt;5min</div>
                <p className="text-primary-foreground/80">Average wait time</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <p className="text-primary-foreground/80">Always available</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-center">100% Secure</h3>
                <p className="opacity-90 text-center">HIPAA compliant - Your data never gets compromised</p>
              </div>
              <div>
                <Award className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-center">Quality Guaranteed</h3>
                <p className="opacity-90 text-center">Only board-certified doctors - No risk of unqualified care</p>
              </div>
              <div>
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-center">Money-Back Promise</h3>
                <p className="opacity-90 text-center">Not satisfied? Full refund - Zero risk to try</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Final Loss Aversion Push */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-3xl p-8 md:p-12 text-center border-2 border-primary/20">
              <Badge className="urgency-badge mb-6">
                <Clock className="h-3.5 w-3.5" />
                Limited spots available today
              </Badge>
              
              <h2 className="mb-6">Don't miss out on immediate care</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Thousands already got help today. Your health concern won't improve by waiting. 
                <span className="font-semibold text-foreground"> Act now before symptoms worsen.</span>
              </p>
              
              {/* Loss Aversion Framing */}
              <div className="bg-background rounded-xl p-6 mb-8 max-w-2xl mx-auto">
                <p className="text-lg mb-4 font-semibold">What you risk by waiting:</p>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Condition worsens</p>
                      <p className="text-sm text-muted-foreground">Simple issues become complex</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Higher costs later</p>
                      <p className="text-sm text-muted-foreground">ER visits cost 10x more</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Lost productivity</p>
                      <p className="text-sm text-muted-foreground">Days missed from work/life</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Unnecessary suffering</p>
                      <p className="text-sm text-muted-foreground">Why endure preventable pain?</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg h-14 px-10 shadow-xl" asChild>
                  <Link to="/instant-consultation">
                    Get Care Now - Don't Wait
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                  <Link to="/auth?mode=signup">
                    Try Free First Visit
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                ✓ No commitment required  ✓ Most insurance accepted  ✓ 100% money-back guarantee
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}