import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Languages, HelpCircle, Sparkles, Users, X } from "lucide-react";
import kslLogo from "@/assets/ksl-logo.png";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user] = useState<StoredUser>(getStoredUser);

  const handleLogout = () => {
    localStorage.removeItem("ksl_token");
    localStorage.removeItem("ksl_user");
    window.dispatchEvent(new Event("ksl-user-update"));
    navigate("/", { replace: true });
  };

  const navLinks = [
    { key: "translate", to: "/translate", label: "Translate", icon: Languages },
    { key: "howItWorks", to: "/how-it-works", label: "How it works", icon: HelpCircle },
    { key: "features", to: "/features", label: "Features", icon: Sparkles },
    { key: "about", to: "/about", label: "About", icon: Users },
  ] as const;

  return (
    <>
      <header className="w-full z-40 relative flex items-center justify-between px-6 py-6 md:px-12 bg-transparent">
        {/* Left corner: Logo */}
        <Link to="/" className="flex items-center gap-3 group select-none">
          <img src={kslLogo} alt="GestureMind" className="h-16 w-auto object-contain" />
          <span className="font-script text-[36px] text-[#0B252E] leading-none">
            GestureMind
          </span>
        </Link>

        {/* Right corner: Button group */}
        <div className="flex items-center bg-[#90DDF5] p-1.5 rounded-full shadow-sm">
          {/* CTA Button */}
          {user ? (
            <Link
              to={user.role === "admin" ? "/admin" : "/profile"}
              className="flex items-center gap-2 text-[#0B252E] hover:bg-[#0B252E]/10 font-light text-[13px] md:text-[14px] px-5 py-2.5 rounded-full uppercase tracking-wider transition-all duration-200"
            >
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/auth?tab=register"
              className="flex items-center gap-2 text-[#0B252E] hover:bg-[#0B252E]/10 font-light text-[13px] md:text-[14px] px-5 py-2.5 rounded-full uppercase tracking-wider transition-all duration-200"
            >
              <Languages size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Start Translating</span>
              <span className="sm:hidden">Translate</span>
            </Link>
          )}

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 bg-[#0B252E] hover:bg-[#143d4c] text-[#F6F4EF] font-light text-[13px] md:text-[14px] px-5 py-2.5 ml-1 rounded-full uppercase tracking-wider transition-all duration-200"
          >
            {/* ||| Icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#90DDF5]" aria-hidden="true">
              <rect x="1" y="2" width="2" height="8" fill="currentColor" rx="0.5" />
              <rect x="5" y="2" width="2" height="8" fill="currentColor" rx="0.5" />
              <rect x="9" y="2" width="2" height="8" fill="currentColor" rx="0.5" />
            </svg>
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Off-Canvas Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-display">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-[#0B252E]/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#F6F4EF] shadow-card flex flex-col justify-between p-8 relative z-50">
              
              {/* Top Bar */}
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 select-none" onClick={() => setIsMenuOpen(false)}>
                  <img src={kslLogo} alt="GestureMind" className="h-16 w-auto object-contain" />
                  <span className="font-script text-[36px] text-[#0B252E] leading-none">
                    GestureMind
                  </span>
                </Link>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-[#0B252E] hover:bg-[#0B252E]/10 rounded-full transition-colors focus:outline-none"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-5 my-10">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.key}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between text-[16px] md:text-[18px] font-display font-medium tracking-tight py-2.5 px-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "text-[#0B252E] bg-[#90DDF5]/25"
                          : "text-[#0B252E] hover:text-[#90DDF5] hover:bg-[#0B252E]/5"
                      }`}
                    >
                      <span>{link.label}</span>
                      <Icon size={18} className={isActive ? "text-[#0B252E]" : "text-[#0B252E]/60"} />
                    </Link>
                  );
                })}
              </nav>

              {/* Session / Authentication Block */}
              <div className="flex flex-col gap-2 mt-auto">
                {user ? (
                  <>
                    <Link
                      to={user.role === "admin" ? "/admin" : "/profile"}
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-center bg-[#0B252E] text-[#F6F4EF] hover:bg-[#143d4c] font-light text-[14px] py-3 rounded-full uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center border-2 border-[#0B252E] text-[#0B252E] hover:bg-[#0B252E]/5 font-light text-[14px] py-3 rounded-full uppercase tracking-wider transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth?tab=login"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-center border-2 border-[#0B252E] text-[#0B252E] hover:bg-[#0B252E]/5 font-light text-[14px] py-3 rounded-full uppercase tracking-wider transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth?tab=register"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-center bg-[#0B252E] text-[#F6F4EF] hover:bg-[#143d4c] font-light text-[14px] py-3 rounded-full uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
