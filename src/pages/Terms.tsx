import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="container px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using DUNIAMED's platform, you agree to be bound by these Terms of Service and all
                applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from
                using or accessing this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                DUNIAMED provides a telemedicine platform connecting patients with verified healthcare specialists
                worldwide. Our services include virtual consultations, prescription management, medical record storage,
                and appointment scheduling.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <h3 className="text-xl font-semibold mb-2">For Patients</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and complete medical information</li>
                <li>Follow prescribed treatment plans</li>
                <li>Pay for services in a timely manner</li>
                <li>Respect healthcare providers' time and expertise</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">For Healthcare Providers</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Maintain valid medical licenses and certifications</li>
                <li>Provide accurate professional information</li>
                <li>Deliver quality care within your scope of practice</li>
                <li>Comply with applicable medical regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Medical Disclaimer</h2>
              <p className="text-muted-foreground">
                DUNIAMED is a platform that facilitates connections between patients and healthcare providers. We do
                not provide medical advice, diagnosis, or treatment. All medical decisions are made by licensed
                healthcare professionals. In case of emergency, call your local emergency services immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Payment Terms</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Consultation fees are set by individual healthcare providers</li>
                <li>Payment is required before or at the time of service</li>
                <li>Refunds are subject to our refund policy</li>
                <li>Platform fees may apply to transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cancellation Policy</h2>
              <p className="text-muted-foreground">
                Appointments may be cancelled up to 24 hours before the scheduled time for a full refund. Cancellations
                within 24 hours may be subject to cancellation fees.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on the DUNIAMED platform, including text, graphics, logos, and software, is the property
                of DUNIAMED or its licensors and is protected by copyright and intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Impersonating another person or entity</li>
                <li>Sharing account credentials</li>
                <li>Attempting to breach security measures</li>
                <li>Using the platform for illegal purposes</li>
                <li>Harassing or threatening other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                DUNIAMED shall not be liable for any indirect, incidental, special, consequential, or punitive damages
                resulting from your use of or inability to use the platform. Our total liability shall not exceed the
                amount paid by you for services in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless DUNIAMED from any claims, damages, losses, liabilities, and
                expenses arising from your use of the platform or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at any time for violation of these terms
                or for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the State of California, United States, without regard to its
                conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these terms at any time. Continued use of the platform after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, contact us at:<br />
                Email: legal@duniamed.com<br />
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
