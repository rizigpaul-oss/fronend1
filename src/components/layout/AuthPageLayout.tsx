import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import kslLogo from "@/assets/ksl-logo.png";
import Grainient from "@/components/ui/Grainient";

type AuthPageLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  brandLabel?: string;
  homeLabel?: string;
  hideLeftPanel?: boolean;
};

export function AuthPageLayout({
  children,
  title,
  subtitle,
  brandLabel = "GestureMind",
  homeLabel = "Home",
  hideLeftPanel = false,
}: AuthPageLayoutProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("auth-route");
    body.classList.add("auth-route");
    return () => {
      html.classList.remove("auth-route");
      body.classList.remove("auth-route");
    };
  }, []);

  const year = new Date().getFullYear();

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

      {!hideLeftPanel && (
        <aside className="relative hidden h-full w-[42%] shrink-0 flex-col text-[#0B252E] lg:flex z-10 border-r border-[#0B252E]/10">
          <div className="absolute inset-0 bg-transparent" aria-hidden />
          <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
            <Link to="/" className="font-script text-[26px] text-[#0B252E]/80 hover:text-[#0B252E]">
              {brandLabel}
            </Link>
            <div className="flex flex-1 flex-col items-center justify-center">
              <img
                src={kslLogo}
                alt="KSL"
                className="mb-8 h-24 w-24 object-contain xl:h-28 xl:w-28"
              />
              <div className="auth-brand-mark" aria-hidden />
            </div>
            <p className="font-script text-[14px] text-[#0B252E]/50">© GestureMind {year}.</p>
          </div>
        </aside>
      )}

      <div
        className={`relative flex h-full min-h-0 flex-1 flex-col bg-transparent text-white z-10 ${
          hideLeftPanel ? "items-center justify-start" : ""
        }`}
      >
        <div
          className="pointer-events-none absolute left-0 top-[18%] h-64 w-64 rounded-full bg-white/[0.04] blur-3xl"
          aria-hidden
        />
        <div
          className={`relative z-10 flex h-full min-h-0 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12 ${
            hideLeftPanel ? "w-full max-w-[640px] mx-auto" : ""
          }`}
        >
          <div className={`mb-4 flex items-center justify-between ${hideLeftPanel ? "mb-6" : "lg:mb-2"}`}>
            <Link to="/" className="text-[13px] text-white/50 hover:text-white lg:hidden">
              ← {homeLabel}
            </Link>
            {!hideLeftPanel && (
              <img
                src={kslLogo}
                alt="KSL"
                className="h-8 w-8 object-contain lg:hidden"
              />
            )}
          </div>

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto py-4 custom-scrollbar ${
              hideLeftPanel ? "w-full" : "lg:max-w-md"
            }`}
          >
            <div className={`${hideLeftPanel ? "text-center mb-8" : "mb-6"}`}>
              <h1
                className={`font-display font-semibold leading-tight text-white ${
                  hideLeftPanel ? "text-[34px] sm:text-[40px] mb-3" : "text-[36px] sm:text-[42px] mb-2"
                }`}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-[14px] leading-relaxed text-white/50">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPageLayout;
