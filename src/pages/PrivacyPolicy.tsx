import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="container px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                DUNIAMED ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our healthcare platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Name, email address, phone number, and date of birth</li>
                <li>Medical history, health conditions, and symptoms</li>
                <li>Payment and billing information</li>
                <li>Government-issued identification for verification purposes</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Health Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Medical records, prescriptions, and test results</li>
                <li>Consultation notes and treatment plans</li>
                <li>Video consultation recordings (with your consent)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>IP address, browser type, and device information</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide and manage healthcare services</li>
                <li>Facilitate communication between patients and healthcare providers</li>
                <li>Process payments and billing</li>
                <li>Improve our platform and services</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Send important updates and notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Healthcare providers involved in your care</li>
                <li>Service providers who assist in our operations (payment processors, cloud storage)</li>
                <li>Law enforcement when required by law</li>
                <li>Other parties with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including encryption, secure servers, and access
                controls to protect your information. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access and obtain a copy of your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide services and comply with legal
                obligations. Medical records are retained according to applicable healthcare regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place for international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to children under 13. We do not knowingly collect information from
                children without parental consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email
                or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, contact us at:<br />
                Email: privacy@duniamed.com<br />
                Address: 123 Healthcare Drive, San Francisco, CA 94102
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
