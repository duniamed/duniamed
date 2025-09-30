import { Link } from "react-router-dom";

export default function Footer() {
  const footerLinks = {
    Product: [
      { name: "How It Works", href: "/how-it-works" },
      { name: "For Patients", href: "/for-patients" },
      { name: "For Specialists", href: "/for-specialists" },
      { name: "For Clinics", href: "/for-clinics" },
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/about/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/legal/privacy" },
      { name: "Terms of Service", href: "/legal/terms" },
      { name: "HIPAA Compliance", href: "/legal/hipaa" },
      { name: "Cookie Policy", href: "/legal/cookies" },
    ],
  };

  return (
    <footer className="bg-muted/30 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                D
              </div>
              <span className="text-xl font-bold">DUNIAMED</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Global healthcare marketplace connecting patients with verified specialists worldwide.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DUNIAMED. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <select className="text-sm bg-background border rounded-md px-3 py-1.5">
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="pt">🇵🇹 Português</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
              <select className="text-sm bg-background border rounded-md px-3 py-1.5">
                <option value="us">🇺🇸 United States</option>
                <option value="uk">🇬🇧 United Kingdom</option>
                <option value="br">🇧🇷 Brazil</option>
                <option value="pt">🇵🇹 Portugal</option>
                <option value="es">🇪🇸 Spain</option>
                <option value="fr">🇫🇷 France</option>
                <option value="de">🇩🇪 Germany</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}