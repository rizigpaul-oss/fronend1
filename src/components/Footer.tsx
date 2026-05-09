import { useState, useRef, useEffect } from "react";
import { ChevronDown, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import kslLogo from "@/assets/ksl-logo.png";
import { useLanguage, type Language } from "@/context/LanguageContext";

const Footer = () => {
  const { language, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const currentYear = new Date().getFullYear();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "english", label: "English", flag: "🇺🇸" },
    { code: "kinyarwanda", label: "Kinyarwanda", flag: "🇷🇼" },
    { code: "french", label: "Français", flag: "🇫🇷" },
  ];

  const currentLangLabel = languages.find((l) => l.code === language)?.label || "Language";

  // Consolidating current content into the LinkedIn-style link list
  const links = [
    { key: "about", to: "/about", labels: { english: "About", kinyarwanda: "Ibyerekeye", french: "À propos" } },
    { key: "accessibility", to: "/user-guide", labels: { english: "Accessibility", kinyarwanda: "Uburyo bworoheye", french: "Accessibilité" } },
    { key: "userAgreement", to: "/terms-of-service", labels: { english: "User Agreement", kinyarwanda: "Amasezerano", french: "Contrat d'utilisation" } },
    { key: "privacy", to: "/privacy-policy", labels: { english: "Privacy Policy", kinyarwanda: "Politiki y'Ibanga", french: "Confidentialité" } },
    { key: "cookies", to: "/privacy-policy", labels: { english: "Cookie Policy", kinyarwanda: "Kuki", french: "Cookies" } },
    { key: "copyright", to: "/terms-of-service", labels: { english: "Copyright Policy", kinyarwanda: "Uburenganzira bwa kope", french: "Droit d'auteur" } },
    { key: "brand", to: "/about", labels: { english: "Brand Policy", kinyarwanda: "Ikirango", french: "Politique de marque" } },
    { key: "guidelines", to: "/community-forum", labels: { english: "Community Guidelines", kinyarwanda: "Amategeko y'umuryango", french: "Directives" } },
    { key: "home", to: "/", labels: { english: "Home", kinyarwanda: "Ahabanza", french: "Accueil" } },
    { key: "features", to: "/features", labels: { english: "Features", kinyarwanda: "Ibiranga", french: "Fonctionnalités" } },
    { key: "demo", to: "/translate", labels: { english: "Demo", kinyarwanda: "Igerageza", french: "Démo" } },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com" },
    { icon: Twitter, href: "https://www.twitter.com" },
    { icon: Instagram, href: "https://www.instagram.com" },
    { icon: Youtube, href: "https://www.youtube.com" },
  ];

  const taglines = {
    english: "AI-powered Kinyarwanda Sign Language interpreter bridging communication between deaf and hearing communities.",
    kinyarwanda: "Umusemuzi ukoresha ubwenge bw'ikoranabuhanga uhuza abafite ubumuga bwo kutumva no kutavuga ndetse nabavuga bakanumva.",
    french: "Interprète en langue des signes kinyarwanda, propulsé par l'IA, reliant les communautés sourdes et entendantes."
  };

  return (
    <footer className="w-full bg-background border-t border-border py-6 px-4 mt-8 md:mt-20">
      <div className="max-w-[1128px] mx-auto flex flex-wrap items-center justify-center gap-x-4 md:gap-x-5 gap-y-2 md:gap-y-3 text-[12px] md:text-[13px] font-display font-light text-muted-foreground tracking-normal">
        {/* Brand/Copyright Section */}
        <div className="flex items-center gap-2 mr-2">
          <Link to="/" className="flex items-center gap-1 group">
            <img 
              src={kslLogo} 
              alt="KSL Logo" 
              className="h-4 w-auto grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
            />
            <span className="font-light text-foreground text-[14px]">
              <span className="text-ksl-blue">K</span>
              <span className="text-ksl-yellow">S</span>
              <span className="text-ksl-dark dark:text-white">L</span>
            </span>
          </Link>
          <span className="text-[12px]">© {currentYear}</span>
        </div>

        {/* Links Section */}
        {links.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            className="hover:text-primary hover:underline transition-colors whitespace-nowrap"
          >
            {link.labels[language]}
          </Link>
        ))}

        {/* Social - Minimal Icons */}
        <div className="flex items-center gap-3 ml-1 pr-3 border-r border-border h-3 hidden sm:flex">
          {socialLinks.map((social, i) => (
            <a key={i} href={social.href} className="hover:text-primary transition-colors">
              <social.icon size={14} strokeWidth={1.5} />
            </a>
          ))}
        </div>

        {/* Language Selection */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer font-light outline-none"
          >
            <span>{languages.find(l => l.code === language)?.flag}</span>
            <span className="hidden sm:inline">{currentLangLabel}</span>
            <ChevronDown size={14} strokeWidth={1.5} className={`mt-0.5 transition-transform duration-200 ${showLangMenu ? "rotate-180" : ""}`} />
          </button>

          {showLangMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-36 bg-card border border-border rounded-md shadow-xl overflow-hidden z-50 animate-fade-in">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[12px] hover:bg-muted transition-colors flex items-center gap-2 ${
                    language === lang.code ? "bg-primary/10 text-primary font-light underline" : ""
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtle Tagline - Bottom Bar */}
      <div className="max-w-[1128px] mx-auto mt-6 pt-4 border-t border-border/30">
        <p className="text-[10px] text-center text-muted-foreground/50 font-display font-light">
          {taglines[language]}
        </p>
      </div>
    </footer>
  );
};

export default Footer;

