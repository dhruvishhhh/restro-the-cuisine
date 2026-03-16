import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import MenuPreview from "@/components/MenuPreview";
import LocationsSection from "@/components/LocationsSection";
import InstagramGrid from "@/components/InstagramGrid";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [requirement, setRequirement] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "siteConfig", "daily-requirement"), (doc) => {
      if (doc.exists() && doc.data().text) {
        setRequirement(doc.data().text);
      } else {
        setRequirement(null);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden md:overflow-visible">
      <AnimatePresence>
        {requirement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-primary text-background py-2 px-4 text-center text-[10px] font-sans tracking-widest uppercase border-b border-white/10"
          >
            {requirement}
          </motion.div>
        )}
      </AnimatePresence>
      <Header topOffset={requirement ? true : false} />
      
      {/* Scroll Container for Mobile 'Single Screen' Feel */}
      <main className="snap-y snap-mandatory md:snap-none overflow-y-auto h-[100dvh] md:h-auto scroll-smooth">
        <div className="snap-start h-[100dvh] md:h-auto overflow-hidden">
          <HeroSection topOffset={requirement ? true : false} />
        </div>
        
        <div className="snap-start h-[100dvh] md:h-auto">
          <AboutSection showViewMore={true} />
        </div>
        
        <div className="snap-start h-[100dvh] md:h-auto">
          <ExperienceSection showViewMore={true} />
        </div>
        
        <div className="snap-start h-[100dvh] md:h-auto bg-background">
          <MenuPreview showViewMore={true} />
        </div>

        <div className="snap-start h-[100dvh] md:h-auto">
          <LocationsSection />
        </div>

        <div className="snap-start min-h-[100dvh] md:min-h-0 bg-background flex flex-col justify-between">
          <div className="py-20 md:py-24 flex-grow flex flex-col justify-center">
            <h2 className="section-heading text-center mb-8 md:mb-12 text-3xl md:text-5xl">Capture the Serenity</h2>
            <div className="px-4 md:px-0">
              <InstagramGrid />
            </div>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Index;
