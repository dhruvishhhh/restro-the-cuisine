import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MenuPreview from "@/components/MenuPreview";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const MenuPage = () => {
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
                    <h1 className="section-heading text-center mb-4">Our Sacred Menu</h1>
                    <p className="text-center text-muted-foreground font-sans tracking-widest uppercase text-xs mb-12">
                        A journey through earth-borne flavors
                    </p>
                    <MenuPreview />
                </div>
            </motion.main>
            <Footer />
        </div>
    );
};

export default MenuPage;
