import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Smile, Shield, Calendar, Video } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForClinics() {
  return (
    <Layout>
        {/* Hero Section - VOA Health inspired */}
        <section className="section-padding bg-gradient-to-br from-soft-purple via-background to-accent/5">
          <div className="container-modern text-center space-y-10">
            <h1 className="font-display">
              Serviços digitais para saúde{" "}
              <span className="gradient-text">conectados de ponta a ponta</span>
            </h1>
            
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed">
              Integramos operadoras, clínicas e pacientes em uma plataforma inteligente e segura. Escolha seu perfil e descubra a solução ideal para seu negócio.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
              <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl font-bold" asChild>
                <Link to="/auth?mode=signup&role=clinic_admin">Comece grátis</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                ✓ Utilize agora em suas consultas
              </span>
              <span className="flex items-center gap-2">
                ✓ Use mesmo sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                ✓ Suporte 24 horas
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
                Gestão completa de clínicas
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Tudo que você precisa para administrar sua prática médica moderna
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Agendamento Inteligente",
                  description: "Sistema de agendas com distribuição automática e otimização de horários"
                },
                {
                  icon: Video,
                  title: "Teleatendimento",
                  description: "Consultas por vídeo com qualidade HD e gravação automática"
                },
                {
                  icon: Shield,
                  title: "Conformidade LGPD",
                  description: "Totalmente em conformidade com LGPD e padrões internacionais"
                },
                {
                  icon: Users,
                  title: "Gestão de Equipe",
                  description: "Gerenciamento completo de médicos, permissões e relatórios"
                },
                {
                  icon: Building2,
                  title: "Multi-unidades",
                  description: "Gerencie múltiplas clínicas em uma única plataforma"
                },
                {
                  icon: Smile,
                  title: "Portal do Paciente",
                  description: "App exclusivo para pacientes acessarem documentos e agendarem"
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
                Pronto para modernizar sua clínica?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
                Junte-se a centenas de clínicas que já transformaram sua gestão com nossa plataforma
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button size="lg" className="h-16 px-12 text-lg rounded-full shadow-xl font-bold" asChild>
                  <Link to="/auth?mode=signup&role=clinic_admin">Começar teste grátis</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full border-2 font-semibold" asChild>
                  <Link to="/contact">Falar com especialista</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-8">
                ✓ 14 dias grátis ✓ Sem cartão de crédito ✓ Cancelamento a qualquer momento
              </p>
            </div>
          </div>
        </section>
    </Layout>
  );
}
