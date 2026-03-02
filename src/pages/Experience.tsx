import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExperienceSection from "@/components/ExperienceSection";
import InstagramGrid from "@/components/InstagramGrid";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const ExperiencePage = () => {
    return (
        <div className="min-h-screen bg-background pt-24">
            <Header />
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-6 pt-12">
                    <BackButton />
                </div>
                <ExperienceSection />
                <div className="max-w-7xl mx-auto px-6 py-20 border-t border-border/50">
                    <h2 className="section-heading text-center mb-12">Capture the Serenity</h2>
                    <InstagramGrid />
                </div>
            </motion.main>
            <Footer />
        </div>
    );
};

export default ExperiencePage;
