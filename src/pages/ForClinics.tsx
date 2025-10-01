import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Smile, Shield, Calendar, Video } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForClinics() {
  return (
    <Layout>
        {/* Hero Section */}
        <section className="section-padding bg-gradient-to-br from-soft-purple via-background to-accent/5">
          <div className="container-modern text-center space-y-10">
            <h1 className="font-display">
              Digital Health Services{" "}
              <span className="gradient-text">Connected End-to-End</span>
            </h1>
            
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed">
              We integrate providers, clinics, and patients into one intelligent and secure platform. Choose your profile and discover the ideal solution for your practice.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
              <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl font-bold" asChild>
                <Link to="/auth?mode=signup&role=clinic_admin">Start Free</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                ✓ Use now in your consultations
              </span>
              <span className="flex items-center gap-2">
                ✓ No credit card required
              </span>
              <span className="flex items-center gap-2">
                ✓ 24/7 support
              </span>
            </div>
          </div>
        </section>

        {/* Three Column Section - Fluxmed inspired */}
        <section className="section-padding">
          <div className="container-modern">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Clinic Card */}
              <div className="card-soft text-center group hover:shadow-xl transition-all">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Sou uma clínica ou consultório</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Usufrua de integrações nativas com WhatsApp, agendamento, teleatendimento, assinaturas digitais, recebimentos de consultas particulares, e ainda, disponibilize aplicativo para o paciente para recebimento de documentos clínicos assinado digitalmente.
                </p>
                <Button variant="outline" size="lg" className="rounded-full" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Saiba mais →</Link>
                </Button>
              </div>

              {/* Operator Card */}
              <div className="card-soft text-center group hover:shadow-xl transition-all">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Sou uma operadora</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Implemente rapidamente integrações de registros eletrônicos de saúde em conformidade padrões nacionais e internacionais, documentos eletrônicos TISS, tudo em uma plataforma segura e moderna.
                </p>
                <Button variant="outline" size="lg" className="rounded-full" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Saiba mais →</Link>
                </Button>
              </div>

              {/* Patient Card */}
              <div className="card-soft text-center group hover:shadow-xl transition-all">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smile className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Sou um paciente</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Acesse seus documentos clínicos como receitas médicas, solicitações de exames e relatórios médicos. Controle quem pode ver seus registros, gerencie membros da sua família e muito mais. Tudo em conformidade com a LGPD.
                </p>
                <Button variant="outline" size="lg" className="rounded-full" asChild>
                  <Link to="/for-patients">Saiba mais →</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="section-padding bg-soft-purple">
          <div className="container-modern">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Complete Clinic Management
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Everything you need to run your modern medical practice
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Intelligent Scheduling",
                  description: "Automated appointment distribution and schedule optimization system"
                },
                {
                  icon: Video,
                  title: "Telehealth",
                  description: "HD video consultations with automatic recording"
                },
                {
                  icon: Shield,
                  title: "GDPR/HIPAA Compliance",
                  description: "Fully compliant with international privacy and data protection standards"
                },
                {
                  icon: Users,
                  title: "Team Management",
                  description: "Complete physician management, permissions, and reporting"
                },
                {
                  icon: Building2,
                  title: "Multi-Location",
                  description: "Manage multiple clinics from a single unified platform"
                },
                {
                  icon: Smile,
                  title: "Patient Portal",
                  description: "Exclusive app for patients to access documents and schedule appointments"
                }
              ].map((feature) => (
                <div key={feature.title} className="card-modern group">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding">
          <div className="container-modern max-w-5xl">
            <div className="card-modern text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Modernize Your Clinic?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
                Join hundreds of clinics that have already transformed their practice with our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl font-bold" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2 font-semibold" asChild>
                  <Link to="/contact">Talk to Specialist</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-8">
                ✓ 14 days free ✓ No credit card ✓ Cancel anytime
              </p>
            </div>
          </div>
        </section>
    </Layout>
  );
}
