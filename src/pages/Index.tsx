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
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {requirement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent text-accent-foreground py-2 px-4 text-center text-xs font-sans tracking-widest uppercase relative z-[1001] border-b border-accent-foreground/10"
          >
            {requirement}
          </motion.div>
        )}
      </AnimatePresence>
      <Header />
      <main>
        <HeroSection />
        <AboutSection showViewMore={true} />
        <ExperienceSection showViewMore={true} />
        <MenuPreview showViewMore={true} />

        <LocationsSection />
        <div className="py-24">
          <h2 className="section-heading text-center mb-12">Capture the Serenity</h2>
          <InstagramGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
