import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import { PageShell } from "@/components/layout/PageShell";

const About = () => {
  return (
    <PageShell className="bg-background">
      <Header />
      <main className="pt-20">
        <AboutSection />
      </main>
      <Footer />
    </PageShell>
  );
};

export default About;
