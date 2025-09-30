import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const navigation = [
    { name: "Urgent Care", href: "/instant-consultation" },
    { name: "Find Specialists", href: "/search" },
    { name: "For Patients", href: "/for-patients" },
    { name: "For Specialists", href: "/for-specialists" },
    { name: "For Clinics", href: "/for-clinics" },
    { name: "How It Works", href: "/how-it-works" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                D
              </div>
              <span className="text-xl font-bold">DUNIAMED</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <select className="text-xs bg-background border rounded-md px-2 py-1">
              <option value="en">🇬🇧 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="pt">🇵🇹 PT</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="de">🇩🇪 DE</option>
            </select>
            <select className="text-xs bg-background border rounded-md px-2 py-1">
              <option value="us">🇺🇸</option>
              <option value="uk">🇬🇧</option>
              <option value="br">🇧🇷</option>
              <option value="pt">🇵🇹</option>
              <option value="es">🇪🇸</option>
              <option value="fr">🇫🇷</option>
              <option value="de">🇩🇪</option>
            </select>
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {profile.first_name[0]}{profile.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">{profile.first_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      to={
                        profile.role === 'specialist' 
                          ? '/specialist/dashboard' 
                          : profile.role === 'clinic_admin' 
                          ? '/clinic/dashboard' 
                          : '/patient/dashboard'
                      } 
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      to={
                        profile.role === 'specialist' 
                          ? '/specialist/profile' 
                          : profile.role === 'clinic_admin' 
                          ? '/clinic/settings' 
                          : '/patient/profile'
                      } 
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <div className="flex gap-2 mb-2">
                <select className="flex-1 text-sm bg-background border rounded-md px-3 py-2">
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                </select>
                <select className="flex-1 text-sm bg-background border rounded-md px-3 py-2">
                  <option value="us">🇺🇸 US</option>
                  <option value="uk">🇬🇧 UK</option>
                  <option value="br">🇧🇷 BR</option>
                  <option value="pt">🇵🇹 PT</option>
                  <option value="es">🇪🇸 ES</option>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="de">🇩🇪 DE</option>
                </select>
              </div>
              {user && profile ? (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link 
                      to={
                        profile.role === 'specialist' 
                          ? '/specialist/dashboard' 
                          : profile.role === 'clinic_admin' 
                          ? '/clinic/dashboard' 
                          : '/patient/dashboard'
                      } 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link 
                      to={
                        profile.role === 'specialist' 
                          ? '/specialist/profile' 
                          : profile.role === 'clinic_admin' 
                          ? '/clinic/settings' 
                          : '/patient/profile'
                      } 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}