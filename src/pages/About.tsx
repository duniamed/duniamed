import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, Shield, Heart, Target, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="gradient-hero py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Transforming Global Healthcare Access
              </h1>
              <p className="text-xl text-muted-foreground">
                DUNIAMED connects patients worldwide with verified healthcare specialists,
                breaking down geographical barriers to quality medical care.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                We believe that everyone deserves access to quality healthcare, regardless of their location.
                DUNIAMED was founded to bridge the gap between patients seeking specialized care and
                qualified healthcare professionals around the world.
              </p>
              <p className="text-muted-foreground">
                Through our secure, HIPAA-compliant platform, we enable virtual consultations that bring
                expert medical advice to patients wherever they are, while ensuring the highest standards
                of privacy and data protection.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>10K+</CardTitle>
                  <CardDescription>Verified Specialists</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>150+</CardTitle>
                  <CardDescription>Countries Served</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>100%</CardTitle>
                  <CardDescription>HIPAA Compliant</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Heart className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>1M+</CardTitle>
                  <CardDescription>Consultations</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Target className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Patient First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every decision we make prioritizes patient safety, privacy, and access to quality care.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Trust & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We maintain the highest standards of data security and privacy protection across all our services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We verify all healthcare professionals and continuously improve our platform to deliver exceptional care.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Team</h2>
            <p className="text-muted-foreground mb-8">
              DUNIAMED is built by a diverse team of healthcare professionals, engineers, and designers
              united by a common goal: making quality healthcare accessible to everyone, everywhere.
            </p>
            <p className="text-muted-foreground">
              With backgrounds spanning medicine, technology, and healthcare policy, our team brings
              together the expertise needed to transform how healthcare is delivered globally.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
