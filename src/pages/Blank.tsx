import Grainient from "@/components/ui/Grainient";

const Blank = () => {
  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden">
      {/* Same warm golden grainy gradient as auth pages */}
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
  );
};

export default Blank;
