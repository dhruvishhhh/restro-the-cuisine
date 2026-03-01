import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import MenuPreview from "@/components/MenuPreview";
import LocationsSection from "@/components/LocationsSection";
import ReservationSection from "@/components/ReservationSection";
import InstagramGrid from "@/components/InstagramGrid";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <MenuPreview />
        <LocationsSection />
        <ReservationSection />
        <InstagramGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
