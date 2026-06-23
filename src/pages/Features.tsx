import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturesSection from "@/components/FeaturesSection";
import { PageShell } from "@/components/layout/PageShell";

const Features = () => {
  return (
    <PageShell className="bg-background">
      <Header />
      <main className="pt-20">
        <FeaturesSection />
      </main>
      <Footer />
    </PageShell>
  );
};

export default Features;
