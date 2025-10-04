import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import Layout from "@/components/layout/Layout";

export default function Home() {
  const { t } = useTranslation();
  const services = [
    {
      icon: Stethoscope,
      title: t('home.services.urgentCare.title'),
      description: t('home.services.urgentCare.description'),
      conditions: [
        t('home.services.urgentCare.conditions.0'),
        t('home.services.urgentCare.conditions.1'),
        t('home.services.urgentCare.conditions.2'),
        t('home.services.urgentCare.conditions.3')
      ]
    },
    {
      icon: Video,
      title: t('home.services.mentalHealth.title'),
      description: t('home.services.mentalHealth.description'),
      conditions: [
        t('home.services.mentalHealth.conditions.0'),
        t('home.services.mentalHealth.conditions.1'),
        t('home.services.mentalHealth.conditions.2'),
        t('home.services.mentalHealth.conditions.3')
      ]
    },
    {
      icon: Calendar,
      title: t('home.services.primaryCare.title'),
      description: t('home.services.primaryCare.description'),
      conditions: [
        t('home.services.primaryCare.conditions.0'),
        t('home.services.primaryCare.conditions.1'),
        t('home.services.primaryCare.conditions.2'),
        t('home.services.primaryCare.conditions.3')
      ]
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: t('home.howItWorks.step1.title'),
      description: t('home.howItWorks.step1.description')
    },
    {
      step: "2",
      title: t('home.howItWorks.step2.title'),
      description: t('home.howItWorks.step2.description')
    },
    {
      step: "3",
      title: t('home.howItWorks.step3.title'),
      description: t('home.howItWorks.step3.description')
    }
  ];

  return (
    <Layout>
        {/* Hero Section - Modern & Clean */}
        <section className="section-padding">
          <div className="container-modern">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                {/* Badge */}
                <Badge className="inline-flex items-center gap-2.5 px-6 py-3 bg-green-50 dark:bg-green-500/10 border-0 text-green-700 dark:text-green-400 rounded-full font-semibold">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  {t('home.hero.badge')}
                </Badge>
                
                <div className="space-y-6">
                  <h1 className="font-display leading-tight">
                    {t('home.hero.title')}
                    <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mt-2">
                      {t('home.hero.titleHighlight')}
                    </span>
                  </h1>
                  <p className="text-2xl text-muted-foreground leading-relaxed font-light max-w-xl">
                    {t('home.hero.subtitle')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 font-semibold shadow-xl" asChild>
                    <Link to="/instant-consultation">{t('home.hero.ctaPrimary')}</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2 font-semibold" asChild>
                    <Link to="/search">{t('home.hero.ctaSecondary')}</Link>
                  </Button>
                </div>
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>{t('home.trust.hipaa')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Verified Doctors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>24/7 Available</span>
                  </div>
                </div>
              </div>
              
              {/* Hero Visual */}
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-soft-purple to-white dark:to-background p-16 flex items-center justify-center border border-border/50 shadow-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
                    <Video className="relative w-40 h-40 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section - Benefit Framing */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                Stop suffering - Get help for any condition
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Why endure discomfort when relief is just minutes away? Board-certified specialists ready to help.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card 
                  key={service.title} 
                  className={`benefit-card group relative overflow-hidden border-2 ${
                    index === 0 ? 'border-primary/20 shadow-lg shadow-primary/10' : 'hover:border-primary/20'
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8 space-y-6">
                    {/* Icon */}
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-primary/10 rounded-2xl" />
                      <div className="relative w-full h-full flex items-center justify-center">
                        <service.icon className="h-8 w-8 text-primary" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">{service.title}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </div>
                    
                    {/* Price Anchoring */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/5 rounded-xl p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Typical visit</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-primary">$0-79</p>
                        <p className="text-sm text-muted-foreground line-through">$200</p>
                      </div>
                      <p className="text-xs text-muted-foreground">With insurance usually $0</p>
                    </div>
                    
                    {/* Conditions List */}
                    <ul className="space-y-3">
                      {service.conditions.map((condition) => (
                        <li key={condition} className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{condition}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <Button 
                      asChild 
                      className={`w-full h-12 font-semibold ${
                        index === 0 ? 'shadow-md shadow-primary/20' : ''
                      }`}
                      variant={index === 0 ? "default" : "outline"}
                    >
                      <Link to="/search">Get Help Now</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 scroll-mt-16">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Get care in 3 simple steps</h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                No complicated processes. Just fast, effective healthcare.
              </p>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12">
              {howItWorks.map((item, index) => (
                <div key={item.step} className="relative">
                  {/* Connector Line */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                  )}
                  
                  {/* Card */}
                  <div className="relative bg-background border-2 border-border rounded-2xl p-8 hover:border-primary/30 transition-all hover:shadow-lg group">
                    {/* Step Number */}
                    <div className="relative inline-flex mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <span className="text-2xl font-bold">{item.step}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button size="lg" className="h-14 px-10 text-base font-semibold shadow-lg shadow-primary/20" asChild>
                <Link to="/instant-consultation">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section - Social Proof & Risk Reduction */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative mx-auto max-w-7xl">
            {/* Header */}
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Don't risk waiting - Join 50,000+ patients
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Your health is too important to compromise on
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16">
              {[
                { number: "50K+", label: "Patients monthly" },
                { number: "4.9★", label: "Average rating" },
                { number: "<5min", label: "Avg wait time" },
                { number: "24/7", label: "Always available" }
              ].map((stat) => (
                <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl md:text-4xl font-bold mb-2 text-white">{stat.number}</div>
                  <p className="text-sm md:text-base text-primary-foreground/80">{stat.label}</p>
                </div>
              ))}
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: "100% Secure", desc: "HIPAA compliant - Your data never gets compromised" },
                { icon: Award, title: "Quality Guaranteed", desc: "Only board-certified doctors - No risk of unqualified care" },
                { icon: TrendingUp, title: "Money-Back Promise", desc: "Not satisfied? Full refund - Zero risk to try" }
              ].map((feature) => (
                <div key={feature.title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
                    <feature.icon className="h-8 w-8 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-primary-foreground/90 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Final Push */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
              
              <div className="relative p-8 md:p-12 space-y-8">
                {/* Badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-pulse">
                    <Clock className="h-4 w-4" />
                    Limited spots available today - Don't miss out
                  </div>
                </div>
                
                {/* Headline */}
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    Your health can't wait
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Thousands already got help today. Don't let your symptoms worsen. 
                    <span className="font-semibold text-foreground"> Act now before it's too late.</span>
                  </p>
                </div>
                
                {/* Risk Grid */}
                <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border">
                  <p className="text-center text-lg font-semibold mb-6">What you risk by waiting:</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { title: "Condition worsens", desc: "Simple issues become complex", icon: AlertCircle },
                      { title: "Higher costs later", desc: "ER visits cost 10x more", icon: AlertCircle },
                      { title: "Lost productivity", desc: "Days missed from work/life", icon: AlertCircle },
                      { title: "Unnecessary suffering", desc: "Why endure preventable pain?", icon: AlertCircle }
                    ].map((risk) => (
                      <div key={risk.title} className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <risk.icon className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold mb-1">{risk.title}</p>
                          <p className="text-sm text-muted-foreground">{risk.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="text-base h-14 px-10 shadow-xl shadow-primary/25" asChild>
                    <Link to="/instant-consultation">
                      Get Care Now - Don't Wait
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base h-14 px-8 border-2" asChild>
                    <Link to="/auth?mode=signup">
                      Try Free First Visit
                    </Link>
                  </Button>
                </div>
                
                {/* Trust Line */}
                <p className="text-center text-sm text-muted-foreground">
                  ✓ No commitment required  ✓ Most insurance accepted  ✓ 100% money-back guarantee
                </p>
              </div>
            </Card>
          </div>
        </section>
    </Layout>
  );
}