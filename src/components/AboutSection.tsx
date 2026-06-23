import { Heart, Users, Target, Lightbulb } from "lucide-react";
import kslLogo from "@/assets/ksl-logo.png";

const values = [
  {
    icon: Heart,
    title: "Accessibility First",
    description: "Breaking communication barriers for the deaf community in Rwanda."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built with input from the deaf community and sign language experts."
  },
  {
    icon: Target,
    title: "Accuracy Focused",
    description: "Continuously improving AI models for precise gesture recognition."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Leveraging cutting-edge AI to preserve and promote KSL."
  },
] as const;

const AboutSection = () => {
  return (
    <section id="about" className="bg-background py-16 md:py-24 font-sans text-foreground">
      <div className="w-full max-w-[800px] mx-auto px-6 relative z-10">
        
        <div className="mb-12">
          <h2 className="text-[36px] md:text-[48px] font-script leading-[1.15] mb-6 text-foreground">
            About GestureMind
          </h2>
          <p className="text-[18px] md:text-[20px] text-foreground font-display font-medium leading-relaxed max-w-xl tracking-tight">
            KSL is an AI-powered platform dedicated to bridging the communication gap in Rwanda. We empower communication between the deaf and hearing communities through technology.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          
          {/* Logo / Image block */}
          <div className="w-full bg-white border border-border rounded-sm p-10 flex items-center justify-center">
            <img src={kslLogo} alt="KSL Logo" className="w-[120px] grayscale" />
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex flex-col gap-3">
                <value.icon className="w-8 h-8 text-primary" />
                <h4 className="font-display font-bold text-[18px] tracking-tight text-foreground">
                  {value.title}
                </h4>
                <p className="text-[16px] text-foreground font-medium leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>

          {/* Text block */}
          <div className="mt-8 p-10 border border-border bg-white shadow-sm flex flex-col items-center text-center">
            <p className="text-[28px] md:text-[34px] font-script text-[#0B252E] leading-relaxed max-w-2xl mx-auto">
              "Over 500,000 members of the deaf community in Rwanda now have a bridge to clear communication. We are proud to be the 1st AI-driven Kinyarwanda Sign Language interpreter."
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
