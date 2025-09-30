import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Globe, 
  Video, 
  Shield, 
  Clock, 
  Heart, 
  Stethoscope,
  Users,
  CheckCircle
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const features = [
    {
      icon: Globe,
      title: "Global Access",
      description: "Connect with verified specialists from around the world"
    },
    {
      icon: Video,
      title: "HD Video Consultations",
      description: "HIPAA-compliant video calls with crystal-clear quality"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end encryption and GDPR/HIPAA compliance"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Book appointments that fit your schedule"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Verified Specialists" },
    { value: "150+", label: "Countries" },
    { value: "50,000+", label: "Consultations" },
    { value: "4.9/5", label: "Average Rating" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 gradient-hero">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-balance mb-6">
                Healthcare Without <span className="text-primary">Borders</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Connect with verified medical specialists globally. Get expert consultations, 
                prescriptions, and care from anywhere in the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/auth?mode=signup&role=patient">Find a Doctor</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth?mode=signup&role=specialist">Join as Specialist</Link>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Why Choose DUNIAMED?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience healthcare reimagined with cutting-edge technology and global reach
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* For Different Users */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="mb-4">Built for Everyone</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-xl transition-shadow">
                <Heart className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-4">For Patients</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Find specialists in 100+ specialties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Book appointments instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Access medical records anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">AI-powered symptom checker</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/for-patients">Learn More</Link>
                </Button>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-shadow border-primary shadow-primary">
                <Stethoscope className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-4">For Specialists</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Reach global patients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Set your own schedule & fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">AI-powered documentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Secure payments & payouts</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/for-specialists">Learn More</Link>
                </Button>
              </Card>

              <Card className="p-8 hover:shadow-xl transition-shadow">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-4">For Clinics</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Virtual & physical clinic management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Multi-doctor collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Automated scheduling & billing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Compliance & reporting tools</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link to="/for-clinics">Learn More</Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to Transform Your Healthcare Experience?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of patients and specialists already using DUNIAMED
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}