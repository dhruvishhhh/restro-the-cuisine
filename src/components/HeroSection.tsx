import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = ({ topOffset = false }: { topOffset?: boolean }) => {
  return (
    <section className={`relative h-[100dvh] w-full overflow-hidden ${topOffset ? 'pt-8' : ''}`} id="hero">
      {/* Background Image with slow zoom */}
      <div className="absolute inset-0 animate-slow-zoom">
        <img
          src={heroBg}
          alt="House of Earth Monk interior with bamboo ceiling and golden pendant lights"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 overlay-gradient" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mb-4 md:mb-6"
        >
          <h2 className="text-xs md:text-base uppercase tracking-[0.4em] font-sans font-medium text-gold/80 mb-4 md:mb-8">
            Est. 2024
          </h2>
          <h1 className="font-serif text-4xl md:text-7xl lg:text-8xl font-medium text-primary-foreground gold-glow tracking-tight leading-[1.1]">
            The House of
            <br />
            Earthmonk
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="font-serif italic text-base md:text-xl text-primary-foreground/70 mb-8 md:mb-12 max-w-md"
        >
          Rooted in Earth. Crafted with Soul.
        </motion.p>

        <motion.a
          href="/reserve"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="px-8 md:px-12 py-3.5 md:py-4 bg-gold text-forest-deep border border-gold uppercase tracking-[0.3em] text-xs md:text-sm font-sans font-bold hover:bg-transparent hover:text-gold transition-all duration-500 shadow-xl shadow-black/20"
        >
          Book A Table
        </motion.a>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary-foreground/40 font-sans">Scroll</span>
        <div className="w-px h-6 md:h-8 bg-gradient-to-b from-gold/40 to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
