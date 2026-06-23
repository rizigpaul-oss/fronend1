import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import Grainient from "@/components/ui/Grainient";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Standard page wrapper: footer sits at content end without extra scroll gap */
export function PageShell({ children, className }: PageShellProps) {
  const location = useLocation();

  // Render animated background and watermark textures everywhere except admin routes
  const showGrainientBg = !location.pathname.startsWith("/admin");

  return (
    <div className={cn("app-page animate-reveal relative overflow-hidden", className)}>
      {showGrainientBg && (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 transition-opacity duration-300">
          {/* Animated Grainient Background */}
          <div className="absolute inset-0 z-0">
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
        </div>
      )}
      <div className="relative z-10 flex flex-col flex-1 w-full">{children}</div>
    </div>
  );
}

export default PageShell;
