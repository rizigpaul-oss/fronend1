import { Link } from "react-router-dom";
import { Camera, Volume2, Database, Globe } from "lucide-react";
import heroImg2 from "@/assets/marketing_about.png";

const featuresList = [
  { 
    id: 1,
    title: "Real-Time Gesture Capture",
    description: "Uses your webcam or smartphone camera to capture hand and body movements performing KSL gestures in real time. Built with the latest AI technology to ensure seamless recognition and near-zero latency.",
    imgFallback: "bg-slate-100 border-border text-slate-400",
    icon: Camera,
    link: "View Live Demo"
  },
  { 
    id: 2,
    title: "KSL-to-Speech Translation",
    description: "Transforms translated text into spoken audio, enabling hearing individuals to understand signed messages instantly. The speech synthesis engine captures natural intonations.",
    imgFallback: "bg-slate-100 border-border text-slate-400",
    icon: Volume2,
    link: "Preview Audio"
  },
  { 
    id: 3,
    title: "Comprehensive Gesture Database",
    description: "Access a massive library of KSL gestures including images, videos, labels, and meanings for accurate recognition. Continuously updated by experts and the community.",
    imgFallback: "bg-slate-100 border-border text-slate-400",
    icon: Database,
    link: "Browse Database"
  },
  { 
    id: 4,
    title: "Multi-Language Support",
    description: "Choose between Kinyarwanda and English for translated text and speech output, ensuring accessibility for different audiences and learners.",
    imgFallback: "bg-slate-100 border-border text-slate-400",
    icon: Globe,
    link: "Language Settings"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-background relative py-16 font-sans text-foreground">
      <div className="w-full max-w-[800px] mx-auto px-6 relative z-10">
        
        {/* Editorial Heading */}
        <div className="mb-16">
          <h2 className="text-[36px] md:text-[48px] font-script leading-[1.15] mb-6 text-foreground">
            Top KSL Features for 2026
          </h2>
          <p className="text-[18px] md:text-[20px] text-foreground font-display font-medium leading-relaxed tracking-tight">
            Our AI-powered platform provides comprehensive tools for translating sign language. Here is a showcase of the best features you can use to bridge the communication gap.
          </p>
        </div>

        {/* Feature List like Template Showcase */}
        <div className="flex flex-col gap-20">
          {featuresList.map((feature) => (
            <div key={feature.id} className="flex flex-col gap-6">
              
              <h3 className="text-[24px] font-display font-bold text-foreground">
                {feature.id}. {feature.title}
              </h3>
              
              {/* Fake Template Image Container */}
              <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-md border border-border bg-white shadow-sm flex items-center justify-center relative overflow-hidden group">
                 {feature.id === 1 ? (
                   <img src={heroImg2} className="w-full h-full object-cover object-top grayscale-[10%]" alt="Feature Preview" />
                 ) : (
                   <div className={`w-full h-full flex flex-col items-center justify-center gap-4 ${feature.imgFallback}`}>
                     <feature.icon size={64} className="opacity-50" />
                     <p className="text-[16px] font-bold uppercase tracking-widest opacity-50 text-foreground">Feature Preview</p>
                   </div>
                 )}
                 {/* Hover Overlay */}
                 <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex flex-col items-start gap-4">
                <p className="text-[16px] text-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>
                <Link to="/how-it-works" className="text-primary font-bold text-[16px] hover:underline decoration-2 underline-offset-4 uppercase tracking-wide">
                  {feature.link} →
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
