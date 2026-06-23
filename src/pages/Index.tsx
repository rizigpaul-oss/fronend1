import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { PageShell } from "@/components/layout/PageShell";

const Index = () => {
  return (
    <PageShell className="bg-background">
      <Header />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </PageShell>
  );
};

export default Index;
