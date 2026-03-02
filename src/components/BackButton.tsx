import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BackButton = () => {
    const navigate = useNavigate();

    return (
        <motion.button
            onClick={() => navigate("/")}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
            className="flex items-center gap-2 text-primary font-sans font-bold text-[10px] uppercase tracking-[0.3em] group mb-8 hover:text-gold transition-colors"
        >
            <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                <ArrowLeft size={14} />
            </div>
            Back to Home
        </motion.button>
    );
};

export default BackButton;
