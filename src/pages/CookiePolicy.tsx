import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="container px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: January 1, 2025</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device when you visit our website. They help us
                provide you with a better experience by remembering your preferences and understanding how you use
                our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Essential Cookies</CardTitle>
                    <CardDescription>Required for the platform to function</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      These cookies are necessary for the website to function and cannot be disabled. They enable core
                      functionality such as security, network management, and accessibility.
                    </p>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                      <li>• Authentication and session management</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Load balancing</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Cookies</CardTitle>
                    <CardDescription>Help us improve the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      These cookies collect information about how you use our platform, helping us improve its
                      performance and user experience.
                    </p>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                      <li>• Page load times and errors</li>
                      <li>• Popular pages and features</li>
                      <li>• User navigation patterns</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Functional Cookies</CardTitle>
                    <CardDescription>Remember your preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      These cookies remember your choices and preferences to provide a more personalized experience.
                    </p>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                      <li>• Language preferences</li>
                      <li>• Display settings</li>
                      <li>• Location data</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Cookies</CardTitle>
                    <CardDescription>Help us understand usage patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We use analytics cookies to understand how visitors interact with our platform, helping us
                      make improvements.
                    </p>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                      <li>• Google Analytics</li>
                      <li>• User behavior analysis</li>
                      <li>• Conversion tracking</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use services from trusted third parties that may also set cookies on your device:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Google Analytics:</strong> Website analytics and performance monitoring</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Daily.co:</strong> Video consultation services</li>
                <li><strong>Supabase:</strong> Authentication and data management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground mb-4">
                You can control and manage cookies in several ways:
              </p>

              <h3 className="text-xl font-semibold mb-2">Browser Settings</h3>
              <p className="text-muted-foreground mb-4">
                Most web browsers allow you to manage cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Delete all cookies</li>
                <li>Block all cookies</li>
                <li>Allow all cookies</li>
                <li>Block third-party cookies</li>
                <li>Clear cookies when closing your browser</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2">Cookie Consent Manager</h3>
              <p className="text-muted-foreground">
                When you first visit our platform, you'll see a cookie consent banner. You can customize your cookie
                preferences at any time through this banner or your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Impact of Disabling Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Please note that disabling certain cookies may impact your experience:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You may need to log in more frequently</li>
                <li>Some features may not work properly</li>
                <li>Your preferences may not be saved</li>
                <li>Personalized content may not be available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Cookie Duration</h2>
              <p className="text-muted-foreground mb-4">
                Cookies may be either:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other
                operational, legal, or regulatory reasons. We will notify you of any significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us at:<br />
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
