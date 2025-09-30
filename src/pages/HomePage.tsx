import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Video, 
  Clock, 
  Shield, 
  Calendar,
  Stethoscope,
  CheckCircle2,
  ArrowDown
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
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          
          <div className="relative mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h1 className="text-balance mb-6 leading-tight">
                  24/7 urgent care and online doctors available
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  Get convenient, high-quality virtual care including urgent care and mental health support. 
                  See a doctor in minutes or schedule ahead.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg h-14 px-8" asChild>
                    <Link to="/instant-consultation">See a Doctor Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                    <Link to="#how-it-works">
                      How it works
                      <ArrowDown className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  Most insurance accepted. Your visit could be $0.
                </p>
              </div>
              
              <div className="relative lg:block">
                <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 aspect-square flex items-center justify-center">
                  <Video className="w-32 h-32 text-primary opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="mb-4">Convenient telehealth appointments</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Connect with board-certified doctors and licensed specialists from home
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.title} className="p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.conditions.map((condition) => (
                      <li key={condition} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full mt-6" variant="outline">
                    <Link to="/search">View All Conditions</Link>
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

        {/* Trust Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">HIPAA Compliant</h3>
                <p className="opacity-90">Your health data is secure and private</p>
              </div>
              <div>
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">24/7 Availability</h3>
                <p className="opacity-90">Access care anytime, day or night</p>
              </div>
              <div>
                <Stethoscope className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Licensed Doctors</h3>
                <p className="opacity-90">Board-certified physicians and specialists</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6">Ready to see a doctor?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of patients getting quality care from home
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg h-14 px-8" asChild>
                <Link to="/instant-consultation">See a Doctor Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-14 px-8" asChild>
                <Link to="/auth?mode=signup&role=specialist">Join as a Specialist</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}