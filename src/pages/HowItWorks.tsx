import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorksSection from "@/components/HowItWorksSection";
import { PageShell } from "@/components/layout/PageShell";

const HowItWorks = () => {
  return (
    <PageShell className="bg-background">
      <Header />
      <main className="pt-20">
        <HowItWorksSection />
      </main>
      <Footer />
    </PageShell>
  );
};

export default HowItWorks;
