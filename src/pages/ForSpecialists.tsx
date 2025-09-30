import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Stethoscope, Globe, Calendar, Video, FileText, Shield } from "lucide-react";
import Layout from "@/components/layout/Layout";

export default function ForSpecialists() {
  return (
    <Layout>
        {/* Hero Section - VOA Health inspired */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-soft-purple">
          <div className="mx-auto max-w-6xl text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Assistente Virtual por IA{" "}
              <span className="text-primary">para registro de consultas médicas</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto font-light">
              Insira seu email para começar grátis a utilizar a inteligência artificial em suas consultas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="h-14 px-8 text-base rounded-full" asChild>
                <Link to="/auth?mode=signup&role=specialist">Comece grátis</Link>
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

        {/* Three Steps Section - VOA Health inspired */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Chega de <span className="text-primary">digitar</span> nas consultas.
              </h2>
              <p className="text-xl text-foreground/70">
                Em apenas 3 passos você terá sua assistente por inteligência artificial!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "1",
                  emoji: "🟢",
                  title: "Faça login e grave o áudio da sua consulta!",
                  description: "Sistema simples e intuitivo para iniciar gravação durante a consulta"
                },
                {
                  step: "2",
                  emoji: "👉",
                  title: "Assim que finalizar a gravação, clique em anamnese e depois em gerar registro",
                  description: "Nossa IA processa automaticamente e estrutura as informações"
                },
                {
                  step: "3",
                  emoji: "🎉",
                  title: "Pronto, seu primeiro registro foi gerado!",
                  description: "Você pode editar e compartilhar com quem desejar"
                }
              ].map((step) => (
                <div key={step.step} className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg font-medium">
                      {step.emoji} {step.title}
                    </p>
                    <p className="text-foreground/70">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-soft-purple/50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Automatize suas atas de consultas médicas{" "}
                <span className="text-primary">e ganhe 250% mais produtividade</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  value: "38 horas",
                  label: "a menos por mês gastos em registro clínico"
                },
                {
                  value: "2.5x mais",
                  label: "valor em informações clínicas nos seus registros"
                },
                {
                  value: "30 segundos",
                  label: "até você começar a usar em uma consulta real"
                }
              ].map((stat) => (
                <Card key={stat.value} className="p-8 text-center hover:shadow-xl transition-all">
                  <div className="text-5xl font-bold text-primary mb-4">{stat.value}</div>
                  <p className="text-lg text-foreground/70">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Veja o que você pode fazer
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Video,
                  title: "Transcrição em tempo real",
                  description: "Acompanhe a transcrição da consulta enquanto atende e faça anotações"
                },
                {
                  icon: FileText,
                  title: "SOAP Notes Automáticas",
                  description: "IA gera registros estruturados seguindo padrão internacional SOAP"
                },
                {
                  icon: Globe,
                  title: "Acesso Global",
                  description: "Atenda pacientes de qualquer lugar do mundo com teleconsulta"
                },
                {
                  icon: Calendar,
                  title: "Agendamento Flexível",
                  description: "Controle total sobre sua agenda e disponibilidade"
                },
                {
                  icon: Shield,
                  title: "Segurança LGPD",
                  description: "Dados criptografados e em conformidade com regulamentações"
                },
                {
                  icon: Stethoscope,
                  title: "Prescrições Digitais",
                  description: "Emita receitas digitais com assinatura eletrônica válida"
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
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-soft-purple">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Pronto para revolucionar suas consultas?
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Junte-se a milhares de médicos que já economizam horas toda semana
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="h-14 px-10 text-base rounded-full" asChild>
                <Link to="/auth?mode=signup&role=specialist">Começar agora</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full" asChild>
                <Link to="/contact">Agendar demonstração</Link>
              </Button>
            </div>
            <p className="text-sm text-foreground/60">
              ✓ Sem cartão de crédito ✓ Configuração em 48 horas ✓ Suporte 24/7
            </p>
          </div>
        </section>
    </Layout>
  );
}
