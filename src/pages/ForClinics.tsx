import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, Smile, Shield, Calendar, Video } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForClinics() {
  return (
    <Layout>
        {/* Hero Section - VOA Health inspired */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-soft-purple">
          <div className="mx-auto max-w-6xl text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Serviços digitais para saúde{" "}
              <span className="text-primary">conectados de ponta a ponta</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto font-light">
              Integramos operadoras, clínicas e pacientes em uma plataforma inteligente e segura. Escolha seu perfil e descubra a solução ideal para seu negócio.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="h-14 px-8 text-base rounded-full" asChild>
                <Link to="/auth?mode=signup&role=clinic_admin">Comece grátis</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-foreground/70">
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
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Clinic Card */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-secondary" />
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
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Users className="h-10 w-10 text-secondary" />
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
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <Smile className="h-10 w-10 text-secondary" />
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-soft-purple/50">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Gestão completa de clínicas
              </h2>
              <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
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
                <Card key={feature.title} className="p-8 hover:shadow-xl transition-all">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground/70">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Pronto para modernizar sua clínica?
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Junte-se a centenas de clínicas que já transformaram sua gestão com nossa plataforma
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="h-14 px-10 text-base rounded-full" asChild>
                <Link to="/auth?mode=signup&role=clinic_admin">Começar teste grátis</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full" asChild>
                <Link to="/contact">Falar com especialista</Link>
              </Button>
            </div>
            <p className="text-sm text-foreground/60">
              ✓ 14 dias grátis ✓ Sem cartão de crédito ✓ Cancelamento a qualquer momento
            </p>
          </div>
        </section>
    </Layout>
  );
}
