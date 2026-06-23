import { Camera, Cpu, FileText, Volume2 } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Camera,
    title: "Capture Gesture",
    description: "Point your camera. Our system detects hands, fingers, and body posture in real-time. Make sure you are well-lit for the best accuracy."
  },
  {
    number: "2",
    icon: Cpu,
    title: "AI Recognition",
    description: "Advanced AI models analyze captures and match them with trained KSL gestures instantly, checking against our massive database."
  },
  {
    number: "3",
    icon: FileText,
    title: "Translation",
    description: "The recognized gesture is instantly translated into highly readable text output in English or Kinyarwanda."
  },
  {
    number: "4",
    icon: Volume2,
    title: "Voice Output",
    description: "Convert the translated text into natural speech for seamless talk. The platform handles text-to-speech perfectly."
  },
] as const;

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-background py-16 md:py-24 font-sans text-foreground">
      <div className="w-full max-w-[800px] mx-auto px-6 relative z-10">
        
        <div className="mb-16 border-b border-border pb-10">
          <h2 className="text-[36px] md:text-[48px] font-script leading-[1.15] mb-6 text-foreground">
            How to Use KSL Interpreter
          </h2>
          <p className="text-[18px] text-foreground font-display font-medium leading-relaxed max-w-xl tracking-tight">
            Our intuitive system makes sign language translation accessible to everyone in just four simple steps. Follow this guide to get started.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {steps.map((step) => {
            return (
              <div key={step.number} className="flex gap-6 items-start relative">
                
                <div className="shrink-0 w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-[20px]">
                  {step.number}
                </div>

                <div className="flex flex-col">
                  <h3 className="text-[22px] font-bold mb-3 tracking-tight leading-[1.1] text-foreground flex items-center gap-2">
                    {step.title}
                  </h3>
                  <p className="font-medium leading-relaxed text-[16px] text-foreground">
                    {step.description}
                  </p>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
