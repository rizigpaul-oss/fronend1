import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage } from "@/context/LanguageContext";

type StoredUser = { id?: string; firstName?: string; lastName?: string; email?: string; role?: string; profilePicture?: string } | null;

function getStoredUser(): StoredUser {
  try {
    const raw = localStorage.getItem("ksl_user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser>(getStoredUser);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    const onUpdate = () => setUser(getStoredUser());
    window.addEventListener("ksl-user-update", onUpdate);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("ksl-user-update", onUpdate);
    };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("ksl_token");
    localStorage.removeItem("ksl_user");
    window.dispatchEvent(new Event("ksl-user-update"));
    navigate("/", { replace: true });
  }, [navigate]);

  const navLinks = [
    { key: "howItWorks", to: "/how-it-works" },
    { key: "translate", to: "/translate" },
    { key: "features", to: "/features" },
    { key: "about", to: "/about" },
  ] as const;

  const labels: Record<string, Record<string, string>> = {
    translate: { kinyarwanda: "Guhindura", english: "Translate", french: "Traduire" },
    features: { kinyarwanda: "Ibiranga", english: "Features", french: "Fonctionnalités" },
    howItWorks: { kinyarwanda: "Uko Bikora", english: "How it works", french: "Comment ça marche" },
    about: { kinyarwanda: "Ibyerekeye", english: "About", french: "À propos" },
    getStarted: { kinyarwanda: "Iyandikishe", english: "Sign up", french: "S'inscrire" },
    login: { kinyarwanda: "Injira", english: "Log in", french: "Se connecter" },
    logout: { kinyarwanda: "Gusohoka", english: "Logout", french: "Se déconnecter" },
    dashboard: { kinyarwanda: "Konti", english: "Dashboard", french: "Tableau de bord" },
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-white/70 dark:bg-background/70 backdrop-blur-xl py-3 border-b border-white/20 dark:border-white/5" 
          : "bg-transparent py-5 border-none"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={kslLogo} 
              alt="KSL Logo" 
              className="h-8 md:h-11 w-auto transition-transform group-hover:scale-105" 
            />
            <span className="font-display font-bold text-xl tracking-tight hidden sm:flex text-foreground">
              <span className="text-ksl-blue">K</span>
              <span className="text-ksl-yellow">S</span>
              <span className="text-ksl-dark dark:text-white">L</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                className={`text-[15px] font-medium text-foreground transition-all hover:text-ksl-blue ${
                  location.pathname === link.to ? "opacity-100 text-ksl-blue" : "opacity-80"
                }`}
              >
                {labels[link.key][language]}
              </Link>
            ))}
          </nav>

          {/* Actions Section */}
          <div className="hidden md:flex items-center justify-end gap-2 shrink-0">
            <ThemeToggle />
            {user ? (
               <>
                 <Button asChild variant="ghost" className="text-[14px] font-semibold text-foreground hover:bg-muted px-4 h-11 border-none">
                    <Link to={user.role === "admin" ? "/admin" : "/profile"}>
                      {labels.dashboard[language]}
                    </Link>
                 </Button>
                 <Button onClick={handleLogout} className="text-[14px] font-semibold rounded-full bg-red-500 text-white px-6 h-11 hover:bg-red-600 transition-colors shadow-none border-none">
                    {labels.logout[language]}
                 </Button>
               </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-[14px] font-semibold text-foreground hover:bg-muted px-4 h-11 border-none">
                  <Link to="/auth?tab=login">{labels.login[language]}</Link>
                </Button>
                <Button asChild className="text-[14px] font-semibold rounded-full bg-ksl-blue text-white px-6 h-11 hover:bg-ksl-blue/90 transition-colors shadow-none border-none">
                  <Link to="/auth?tab=register">{labels.getStarted[language]}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right Section */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
             <button
              className="p-2 text-foreground border-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-6 bg-background animate-in fade-in slide-in-from-top-4 duration-300 mt-4 border-none shadow-xl">
            <nav className="flex flex-col gap-6 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  to={link.to}
                  className={`text-[18px] font-medium transition-colors ${
                    location.pathname === link.to ? "text-ksl-blue" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {labels[link.key][language]}
                </Link>
              ))}
              
              <div className="pt-6 border-none mt-2 space-y-4">
                {user ? (
                   <div className="flex flex-col gap-3">
                     <Button asChild variant="ghost" className="w-full justify-start h-12 text-base rounded-xl bg-muted/50 border-none">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                        {labels.dashboard[language]}
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-12 text-base text-red-500 border-none" onClick={handleLogout}>
                      {labels.logout[language]}
                    </Button>
                   </div>
                ) : (
                  <div className="flex flex-col gap-3">
                     <Button asChild variant="ghost" className="w-full justify-center h-12 text-base font-bold rounded-xl bg-muted/50 text-foreground border-none">
                      <Link to="/auth?tab=login" onClick={() => setIsMenuOpen(false)}>
                        {labels.login[language]}
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-ksl-blue text-white rounded-xl h-12 text-base font-bold shadow-none border-none">
                      <Link to="/auth?tab=register" onClick={() => setIsMenuOpen(false)}>
                        {labels.getStarted[language]}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
