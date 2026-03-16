import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = ({ topOffset = false }: { topOffset?: boolean }) => {
  return (
    <section className={`relative h-[100dvh] w-full overflow-hidden ${topOffset ? 'pt-8' : ''}`} id="hero">
      {/* Background Image with slow zoom */}
      <div className="absolute inset-0 animate-slow-zoom">
        <img
          src={heroBg}
          alt="Restro Global Cuisine Bar & Bistro interior"
          className="w-full h-full object-cover grayscale-[20%] contrast-[110%]"
        />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 overlay-gradient opacity-80" />
      <div className="absolute inset-0 mesh-pattern opacity-20" />
      <div className="absolute inset-0 sunset-glow opacity-40 mix-blend-soft-light" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="mb-4 md:mb-6"
        >
          <h2 className="text-xs md:text-base uppercase tracking-[0.4em] font-sans font-medium text-primary/90 mb-4 md:mb-8">
            Est. 2024
          </h2>
          <h1 className="font-serif text-4xl md:text-7xl lg:text-8xl font-medium text-foreground gold-glow tracking-tight leading-[1.1] drop-shadow-2xl">
            Restro
            <br />
            <span className="text-primary italic">Global Cuisine</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="relative"
        >
          <p className="font-serif italic text-sm md:text-lg text-foreground/80 mb-8 md:mb-12 max-w-md relative z-10">
            A premium multicuisine dining experience.
          </p>
          <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full -z-10" />
        </motion.div>

        <motion.a
          href="/reserve"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="px-8 md:px-12 py-3.5 md:py-4 bg-primary text-background border border-primary uppercase tracking-[0.3em] text-xs md:text-sm font-sans font-bold hover:bg-transparent hover:text-primary transition-all duration-500 shadow-2xl shadow-primary/20 relative overflow-hidden group"
        >
          <span className="relative z-10">Book A Table</span>
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
        </motion.a>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-foreground/40 font-sans">Scroll</span>
        <div className="w-px h-6 md:h-8 bg-gradient-to-b from-primary/40 to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
