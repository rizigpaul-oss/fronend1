import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import kslLogo from "@/assets/ksl-logo.png";
import authBg from "@/assets/marketing_hero.png";
import Grainient from "@/components/ui/Grainient";

const API_URL = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw && raw.trim()) return raw.replace(/\/$/, "");
  return "https://ksl-be-ftj9.onrender.com";
})();

function parseJsonOrNull(response: Response): Promise<Record<string, unknown> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Promise.resolve(null);
  return response.json().catch(() => null);
}

function GlassField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label htmlFor={id} className="block text-[14px] font-medium text-[#0B252E] ml-1">
        {label}
      </label>
      <div className="relative w-full">{children}</div>
    </div>
  );
}

function GlassInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-[#0B252E]/10 bg-white/70 backdrop-blur-md px-4 py-3.5 text-[15px] text-[#0B252E] outline-none placeholder:text-[#0B252E]/50 transition-all hover:border-[#0B252E]/30 focus:border-[#0B252E] focus:ring-4 focus:ring-[#0B252E]/10",
        className
      )}
    />
  );
}

const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);
  const [signupPasswordError, setSignupPasswordError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialTab = (() => {
    const tab = (searchParams.get("tab") ?? "").toLowerCase();
    if (tab === "register" || tab === "signup") return "signup";
    return "login";
  })();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);

  const switchTab = (next: "login" | "signup") => {
    setActiveTab(next);
    setError(null);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", next === "signup" ? "register" : "login");
      return p;
    });
  };

  const validateSignupPassword = (password: string) => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!/[A-Z]/.test(password)) return "Password must include at least 1 uppercase letter.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least 1 special character.";
    return null;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await parseJsonOrNull(response);
      if (!response.ok) {
        setError(
          (data && typeof data.message === "string")
            ? data.message
            : "Failed to log in. Please check your credentials."
        );
        return;
      }
      if (data && typeof data.token === "string") localStorage.setItem("ksl_token", data.token);
      if (data && data.user && typeof data.user === "object") {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }
      const userData = data?.user as { role?: string; profileCompleted?: boolean } | undefined;
      if (userData?.role === "admin") navigate("/admin", { replace: true });
      else if (!userData?.profileCompleted) navigate("/complete-profile", { replace: true });
      else navigate("/", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const passwordValidation = validateSignupPassword(signupPassword);
    setSignupPasswordError(passwordValidation);
    if (passwordValidation) return;
    if (signupPassword !== signupPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: signupFirstName,
          lastName: signupLastName,
          email: signupEmail,
          password: signupPassword,
        }),
      });
      const data = await parseJsonOrNull(response);
      if (!response.ok) {
        setError(
          (data && typeof data.message === "string")
            ? data.message
            : "Failed to create account. Please try again."
        );
        return;
      }
      if (data && typeof data.token === "string") localStorage.setItem("ksl_token", data.token);
      if (data && data.user && typeof data.user === "object") {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }
      const userData = data?.user as { role?: string; profileCompleted?: boolean } | undefined;
      if (userData?.role === "admin") navigate("/admin", { replace: true });
      else if (!userData?.profileCompleted) navigate("/complete-profile", { replace: true });
      else navigate("/", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = activeTab === "login";

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-transparent font-sans">
      {/* Animated Grainient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <Grainient
          color1="#c7b479"
          color2="#e1d4aa"
          color3="#d0be84"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
          className="w-full h-full opacity-60"
        />
      </div>

      {/* Left — Form Panel */}
      <div className="relative flex h-full min-h-0 flex-1 flex-col bg-transparent justify-center items-center z-10">
        
        {/* Top Logo */}
        <div className="absolute top-8 left-8 sm:left-12 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
               <img src={kslLogo} alt="KSL" className="h-6 w-6" />
             </div>
             <span className="font-display font-bold text-xl tracking-tight text-slate-800">
               KSL
             </span>
          </Link>
        </div>

        <div className="relative z-10 flex w-full max-w-[420px] flex-col px-6 py-6 sm:px-0 animate-slide-up">
          
          <div className="flex min-h-0 flex-col justify-center py-4">
            <div className="mb-8">
               <h2 className="mb-2 text-[32px] font-display font-black tracking-tight text-[#0B252E]">
                 {isLogin ? "Welcome back" : "Create account"}
               </h2>
               <p className="text-[15px] text-[#0B252E]/70 font-medium">
                 {isLogin ? "Please enter your details" : "Fill in the details below to get started"}
               </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-semibold text-red-600 text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-6 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-[13px] font-semibold text-green-600 text-center">
                {successMessage}
              </div>
            )}

            <div className="relative z-10">
              {isLogin ? (
                <form className="flex flex-col gap-5" onSubmit={handleLogin}>
                  <GlassField label="Email address" id="login-email">
                    <GlassInput
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </GlassField>

                  <GlassField label="Password" id="login-password">
                    <div className="relative">
                      <GlassInput
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        className="pr-12"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label="Toggle password"
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </GlassField>

                  <div className="mt-1 mb-2 flex items-center justify-between text-[14px] font-medium">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[#0B252E] hover:text-[#0B252E]/80 transition-colors">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-5 w-5 rounded border border-gray-300 bg-white peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      Remember for 30 days
                    </label>
                    <button type="button" className="text-[#0B252E] hover:underline font-semibold">
                      Forgot password
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0B252E] text-[15px] font-bold text-white shadow-button hover:bg-[#143d4c] transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </button>

                  <button
                    type="button"
                    className="w-full flex h-12 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-[15px] font-semibold text-slate-700 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </form>
              ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSignup}>
                  <div className="grid grid-cols-2 gap-4">
                    <GlassField label="First name" id="signup-first-name">
                      <GlassInput
                        id="signup-first-name"
                        required
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                      />
                    </GlassField>
                    <GlassField label="Last name" id="signup-last-name">
                      <GlassInput
                        id="signup-last-name"
                        required
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                      />
                    </GlassField>
                  </div>

                  <GlassField label="Email address" id="signup-email">
                    <GlassInput
                      id="signup-email"
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </GlassField>

                  <GlassField label="Password" id="signup-password">
                    <div className="relative">
                      <GlassInput
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        required
                        className="pr-12"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          if (signupPasswordError) {
                            setSignupPasswordError(validateSignupPassword(e.target.value));
                          }
                        }}
                        onBlur={() => setSignupPasswordError(validateSignupPassword(signupPassword))}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </GlassField>
                  {signupPasswordError && (
                    <p className="mt-1 text-[12px] font-medium text-red-500 px-1">{signupPasswordError}</p>
                  )}

                  <GlassField label="Confirm password" id="signup-password-confirm">
                    <div className="relative">
                      <GlassInput
                        id="signup-password-confirm"
                        type={showSignupPasswordConfirm ? "text" : "password"}
                        required
                        className="pr-12"
                        value={signupPasswordConfirm}
                        onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                        placeholder="••••••••"/>
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                      >
                        {showSignupPasswordConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </GlassField>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0B252E] text-[15px] font-bold text-white shadow-button hover:bg-[#143d4c] transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? "Creating account..." : "Create your account"}
                  </button>
                  
                  <button
                    type="button"
                    className="w-full flex h-12 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-[15px] font-semibold text-slate-700 hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 text-center text-[14px] font-medium text-[#0B252E]/70">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => switchTab("signup")} className="text-[#0B252E] hover:underline font-bold transition-colors">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => switchTab("login")} className="text-[#0B252E] hover:underline font-bold transition-colors">
                    Sign in
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Right — Visual Panel */}
      <aside className="relative hidden h-full w-[45%] lg:w-[50%] shrink-0 flex-col bg-[#0B252E]/80 backdrop-blur-md text-white lg:flex overflow-hidden items-center justify-center z-10 border-l border-white/10">
        
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
        
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url(${authBg})` }}
          aria-hidden
        />
        
        <div className="relative z-10 flex flex-col items-center max-w-md text-center p-12">
          <div className="w-full h-64 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 mb-10 flex items-center justify-center p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-700 ease-in-out"></div>
            <img src={kslLogo} alt="KSL" className="w-32 h-32 opacity-90 drop-shadow-lg" />
          </div>

          <p className="text-[18px] text-white font-display leading-relaxed px-4 text-center">
            Connect globally with real-time interpretation. Start translating sign language instantly on any device.
          </p>
        </div>
        <p className="text-white/60 text-[13px] font-medium absolute bottom-8 left-12">
          © {new Date().getFullYear()} KSL Interpreter. All rights reserved.
        </p>
      </aside>

    </div>
  );
};

export default LoginForm;
