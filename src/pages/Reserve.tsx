import Header from "@/components/Header";
import ReservationSection from "@/components/ReservationSection";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";

const ReservationPage = () => {
    return (
        <div className="min-h-screen md:min-h-screen bg-background pt-16 md:pt-24">
            <Header />
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-6">
                    <BackButton />
                    <ReservationSection fullPage={true} />
                </div>
            </motion.main>
        </div>
    );
};

export default ReservationPage;
