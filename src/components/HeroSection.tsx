import { useState } from "react";
import { Link } from "react-router-dom";
import { Languages, X } from "lucide-react";
import { FlipWords } from "./ui/flip-words";

const HeroSection = () => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Custom organic SVG icons for cards to match the reference image exactly
  const HouseIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M3 9.5L12 2L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20.5V9.5Z" fill="#F0EBE1" stroke="#C5B19D" strokeWidth="2"/>
      <path d="M3 10L12 3L21 10" stroke="#C05C3B" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="9" y="14" width="6" height="8" fill="#C5B19D"/>
    </svg>
  );

  const BuildingIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="5" y="2" width="14" height="20" rx="1" fill="#EDE9E3" stroke="#8E9AA6" strokeWidth="2"/>
      <rect x="8" y="5" width="2" height="3" fill="#8E9AA6"/>
      <rect x="14" y="5" width="2" height="3" fill="#8E9AA6"/>
      <rect x="8" y="10" width="2" height="3" fill="#8E9AA6"/>
      <rect x="14" y="10" width="2" height="3" fill="#8E9AA6"/>
      <rect x="8" y="15" width="2" height="3" fill="#8E9AA6"/>
      <rect x="14" y="15" width="2" height="3" fill="#8E9AA6"/>
    </svg>
  );

  return (
    <section id="home" className="relative w-full min-h-[85vh] flex items-center justify-center bg-transparent py-12 md:py-20 font-sans overflow-visible z-10">
      
      <div className="w-full max-w-[1280px] mx-auto px-6 relative flex flex-col items-center">
        
        {/* Left Side Tagline (Desktop) */}
        <div className="w-full lg:absolute lg:left-6 lg:top-4 max-w-[220px] text-left mb-10 lg:mb-0 select-none animate-slide-up">
          <p className="text-[13px] md:text-[14px] font-normal leading-relaxed text-[#0B252E]/70">
            The integrated sign language translation app for all your communication needs.
          </p>
        </div>

        {/* Central Display Headline Container */}
        <div className="w-full flex flex-col items-center text-center mt-6 lg:mt-16 relative">
          
          {/* Row 1: MAKE [WATCH DEMO] SIGN */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4 max-w-5xl select-none">
            <span className="font-display font-black text-[#0B252E] uppercase tracking-tighter text-[7.5vw] md:text-[6vw] lg:text-[6.5vw] leading-none whitespace-nowrap">
              Make
            </span>

            {/* Inlined Watch Demo Card (Triggering Popup) */}
            <button
              onClick={() => setIsDemoOpen(true)}
              className="inline-flex flex-col justify-between w-[120px] h-[75px] md:w-[170px] md:h-[105px] bg-[#D5C7B1] hover:bg-[#c4b69d] p-3 md:p-4 rounded-2xl md:rounded-[22px] transition-all hover:scale-105 duration-200 shadow-sm text-left group"
              aria-label="Open watch demo video"
            >
              <span className="text-[#0B252E] font-bold text-[9px] md:text-[10px] uppercase tracking-wider leading-none">
                Watch Demo
              </span>
              <div className="flex justify-end items-end w-full">
                <span className="text-[#0B252E] font-bold text-[18px] md:text-[24px] leading-none group-hover:translate-x-1 transition-transform">
                  ▷
                </span>
              </div>
            </button>

            <span className="font-display font-black text-[#0B252E] uppercase tracking-tighter text-[7.5vw] md:text-[6vw] lg:text-[6.5vw] leading-none whitespace-nowrap">
              Sign
            </span>
          </div>

          {/* Row 2: LANGUAGE, REALLY WORK */}
          <div className="relative mt-3 md:mt-6 text-center select-none z-10">
            <span className="font-display font-black text-[#0B252E] uppercase tracking-tighter text-[7.5vw] md:text-[6vw] lg:text-[6.5vw] leading-none block whitespace-nowrap">
              Language, <FlipWords words={["really", "truly", "always", "easily"]} className="text-[#0B252E] lowercase font-script px-1 align-baseline" /> Work
            </span>

            {/* Hand-drawn thin double SVG underline */}
            <div className="absolute left-[5%] right-[5%] bottom-[-16px] md:bottom-[-20px] h-[6px] md:h-[10px] pointer-events-none z-0">
              <svg width="100%" height="100%" viewBox="0 0 600 12" fill="none" preserveAspectRatio="none">
                <path
                  d="M 10 4 Q 300 8, 590 4"
                  stroke="#0B252E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 25 8 Q 300 10, 575 7"
                  stroke="#0B252E"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* ================= FLOATING STATUS CARDS ================= */}

          {/* Card 1: HOME Anika Davis */}
          <div className="absolute left-[15%] top-[-80px] hidden md:flex items-center gap-2 select-none animate-float">
            <div className="flex items-center gap-2.5 bg-[#EDE7DD] border border-[#0B252E]/5 pl-2.5 pr-4 py-1.5 rounded-xl shadow-sm">
              {HouseIcon}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-black uppercase text-[#0B252E]/60 tracking-wider">
                  Home
                </span>
                <span className="text-[14px] font-bold text-[#0B252E] font-script">
                  Anika Davis
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
              alt="Anika Davis"
              className="w-7 h-7 rounded-full border border-white/50 object-cover shadow-sm -ml-0.5"
            />
          </div>

          {/* Card 2: OFFICE Jasper Williams */}
          <div className="absolute right-[18%] top-[-100px] hidden md:flex items-center gap-2 select-none animate-float animation-delay-200">
            <div className="flex items-center gap-2.5 bg-[#EDE7DD] border border-[#0B252E]/5 pl-2.5 pr-4 py-1.5 rounded-xl shadow-sm">
              {BuildingIcon}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-black uppercase text-[#0B252E]/60 tracking-wider">
                  Office
                </span>
                <span className="text-[14px] font-bold text-[#0B252E] font-script">
                  Jasper Williams
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
              alt="Jasper Williams"
              className="w-7 h-7 rounded-full border border-white/50 object-cover shadow-sm -ml-0.5"
            />
          </div>

          {/* Card 3: OFFICE Sienna Ross */}
          <div className="absolute left-[54%] bottom-[-110px] hidden md:flex items-center gap-2 select-none animate-float animation-delay-300">
            <div className="flex items-center gap-2.5 bg-[#EDE7DD] border border-[#0B252E]/5 pl-2.5 pr-4 py-1.5 rounded-xl shadow-sm">
              {BuildingIcon}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-black uppercase text-[#0B252E]/60 tracking-wider">
                  Office
                </span>
                <span className="text-[14px] font-bold text-[#0B252E] font-script">
                  Sienna Ross
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
              alt="Sienna Ross"
              className="w-7 h-7 rounded-full border border-white/50 object-cover shadow-sm -ml-0.5"
            />
          </div>

          {/* Card 4: HOME Ollie Carter */}
          <div className="absolute right-[5%] bottom-[-80px] hidden lg:flex items-center gap-2 select-none animate-float">
            <div className="flex items-center gap-2.5 bg-[#EDE7DD] border border-[#0B252E]/5 pl-2.5 pr-4 py-1.5 rounded-xl shadow-sm">
              {HouseIcon}
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-black uppercase text-[#0B252E]/60 tracking-wider">
                  Home
                </span>
                <span className="text-[14px] font-bold text-[#0B252E] font-script">
                  Ollie Carter
                </span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
              alt="Ollie Carter"
              className="w-7 h-7 rounded-full border border-white/50 object-cover shadow-sm -ml-0.5"
            />
          </div>

        </div>

        {/* Bottom Left CTA & Curly Arrow */}
        <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-start mt-20 md:mt-24 relative self-start">
          
          {/* Refined Curly Arrow pointing to button */}
          <div className="absolute left-[160px] top-[-110px] hidden md:block w-[110px] h-[110px] text-[#0B252E] opacity-95 select-none pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <path
                d="M 75,15 
                   C 60,10 40,25 45,50 
                   C 50,75 80,75 75,50 
                   C 70,25 35,50 20,85"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Perfectly aligned arrowhead pointing down-left */}
              <path
                d="M 32,72 L 20,85 L 18,65"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col items-center md:items-start gap-4 z-10 animate-slide-up animation-delay-200">
            <Link
              to="/translate"
              className="flex items-center gap-3 bg-[#90DDF5] hover:bg-[#74cfeb] text-[#0B252E] font-light text-[14px] md:text-[15px] px-7 py-4 rounded-full uppercase tracking-wider transition-all duration-200 shadow-button select-none hover:-translate-y-0.5"
            >
              <Languages size={16} strokeWidth={2.5} />
              <span>Start Translating</span>
            </Link>
          </div>

        </div>

      </div>

      {/* YouTube Modal Popup */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B252E]/70 backdrop-blur-sm p-4 animate-reveal">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsDemoOpen(false)}
          />
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-card border border-white/10 z-10">
            <button
              onClick={() => setIsDemoOpen(false)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full transition-colors z-20 border border-white/10"
              aria-label="Close video"
            >
              <X size={20} />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/5aLh7cEexm8?autoplay=1"
              title="KSL Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
