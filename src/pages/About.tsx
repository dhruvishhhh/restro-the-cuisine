import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-background pt-24">
            <Header />
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <BackButton />
                    <AboutSection />
                </div>
            </motion.main>
            <Footer />
        </div>
    );
};

export default AboutPage;
