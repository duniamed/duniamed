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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b">
      <nav className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          <div className="flex items-center shrink-0">
            <Link to="/home" className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                D
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold">DUNIAMED</span>
            </Link>
          </div>

          <div className="hidden lg:flex lg:items-center lg:gap-4 xl:gap-6">
            {navigation.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-xs xl:text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            <select className="hidden lg:block text-xs bg-background border rounded-md px-2 py-1.5">
              <option value="en">🇬🇧 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="pt">🇵🇹 PT</option>
            </select>
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {profile.first_name[0]}{profile.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden xl:inline text-sm">{profile.first_name}</span>
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
                <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="h-9 px-3 text-sm">
                  <Link to="/auth?mode=signup">Start</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-2 border-t">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t">
              {user && profile ? (
                <>
                  <Button variant="outline" size="sm" asChild className="w-full h-9 text-sm">
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full h-9 text-sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="w-full h-9 text-sm">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="w-full h-9 text-sm">
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