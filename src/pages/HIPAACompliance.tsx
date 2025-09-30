import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Database, Users, FileCheck, AlertTriangle } from 'lucide-react';

export default function HIPAACompliance() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <section className="gradient-hero py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                HIPAA Compliance
              </h1>
              <p className="text-xl text-muted-foreground">
                Your privacy and data security are our top priorities
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 container px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-muted-foreground">
                DUNIAMED is fully compliant with the Health Insurance Portability and Accountability Act (HIPAA)
                and its regulations. We implement comprehensive administrative, physical, and technical safeguards
                to protect your Protected Health Information (PHI).
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Lock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Data Encryption</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All PHI is encrypted both in transit (TLS 1.3) and at rest (AES-256) using industry-standard
                    encryption protocols.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Access Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Role-based access controls ensure that only authorized personnel can access PHI, with all
                    access logged and monitored.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Secure Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our infrastructure is hosted on HIPAA-compliant cloud services with regular security audits
                    and vulnerability assessments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileCheck className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Business Associate Agreements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We maintain Business Associate Agreements (BAAs) with all third-party service providers who
                    may access PHI.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">HIPAA Safeguards</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Administrative Safeguards</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Designated Privacy and Security Officers</li>
                    <li>• Regular risk assessments and security management processes</li>
                    <li>• Workforce training and management</li>
                    <li>• Contingency planning and disaster recovery</li>
                    <li>• Business associate contracts and agreements</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Physical Safeguards</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Secure data centers with controlled access</li>
                    <li>• Workstation and device security policies</li>
                    <li>• Media disposal and re-use protocols</li>
                    <li>• Facility access controls and monitoring</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Safeguards</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Unique user identification and authentication</li>
                    <li>• Automatic logoff and session management</li>
                    <li>• Audit controls and access logging</li>
                    <li>• Data integrity controls</li>
                    <li>• Transmission security and encryption</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 container px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <AlertTriangle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Breach Notification</CardTitle>
              <CardDescription>
                In the unlikely event of a data breach affecting PHI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We have comprehensive incident response procedures in place. If a breach occurs, we will:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Notify affected individuals within 60 days</li>
                <li>• Provide details about the breach and mitigation steps</li>
                <li>• Report to the Department of Health and Human Services as required</li>
                <li>• Take immediate action to contain and remediate the breach</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Your Rights Under HIPAA</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li>• <strong>Right to Access:</strong> Request copies of your medical records</li>
                  <li>• <strong>Right to Amend:</strong> Request corrections to your health information</li>
                  <li>• <strong>Right to Accounting:</strong> Learn who has accessed your PHI</li>
                  <li>• <strong>Right to Restrict:</strong> Request limitations on PHI use and disclosure</li>
                  <li>• <strong>Right to Confidential Communications:</strong> Request communications via specific methods</li>
                  <li>• <strong>Right to Notice:</strong> Receive our Notice of Privacy Practices</li>
                  <li>• <strong>Right to File a Complaint:</strong> Report concerns about privacy practices</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 container px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Contact Our Privacy Team</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  For questions about HIPAA compliance or to exercise your privacy rights:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Privacy Officer:</strong> privacy@duniamed.com</p>
                  <p><strong>Security Officer:</strong> security@duniamed.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Mail:</strong> DUNIAMED Privacy Office, 123 Healthcare Drive, San Francisco, CA 94102</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
