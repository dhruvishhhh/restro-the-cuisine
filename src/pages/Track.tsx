import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReservationStatusCheck from "@/components/ReservationStatusCheck";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const Track = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <BackButton />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <span className="section-subheading">The House of Earthmonk Access</span>
                        <h1 className="section-heading text-4xl md:text-5xl mt-4">Track Your Request</h1>
                        <p className="text-muted-foreground font-sans mt-4 max-w-lg mx-auto">
                            Enter the phone number used during your reservation to view its real-time status and details.
                        </p>
                    </motion.div>

                    <ReservationStatusCheck />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Track;
