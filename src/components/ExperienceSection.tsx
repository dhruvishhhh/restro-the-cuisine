import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import exp1 from "@/assets/experience-1.jpg";
import exp2 from "@/assets/experience-2.jpg";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "Nature-Integrated Design",
    description: "Every space breathes with living greenery, natural wood, and earth-toned materials that ground you in the moment.",
  },
  {
    title: "Artisan Craftsmanship",
    description: "Hand-selected ceramics, custom bamboo fixtures, and bespoke furniture — each piece tells a story of its maker.",
  },
  {
    title: "Mindful Dining",
    description: "A philosophy of slow food meets conscious sourcing. Seasonal, local, and prepared with meditative intention.",
  },
];

interface ExperienceSectionProps {
  showViewMore?: boolean;
}

const ExperienceSection = ({ showViewMore = false }: ExperienceSectionProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="h-[100dvh] md:h-auto section-padding bg-background relative overflow-hidden flex items-center" id="experience" ref={ref}>
      {/* Decorative Elements */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute inset-0 mesh-pattern opacity-10 pointer-events-none" />
      <div className="absolute inset-0 sunset-glow opacity-30 mix-blend-overlay pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-32"
        >
          <span className="section-subheading text-primary">The Experience</span>
          <h2 className="section-heading text-foreground mt-6 text-balance max-w-4xl mx-auto leading-tight">
            A Restro Global Cuisine Experience for the Senses
          </h2>
          <div className="mt-8 flex justify-center">
             <div className="h-1.5 w-1.5 rounded-full bg-primary mx-1" />
             <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mx-1" />
             <div className="h-1.5 w-1.5 rounded-full bg-primary/20 mx-1" />
          </div>
        </motion.div>

        {/* Image Grid with Offset */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-20 md:mb-36">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="group relative"
          >
            <div className="absolute inset-4 border border-primary/30 rounded-sm translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-700" />
            <div className="overflow-hidden rounded-sm">
              <img
                src={exp1}
                alt="Dining interior"
                className="w-full h-[300px] md:h-[550px] object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out grayscale-[10%]"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
            className="group relative md:mt-16"
          >
            <div className="absolute inset-4 border border-primary/30 rounded-sm -translate-x-4 translate-y-4 -z-10 group-hover:-translate-x-2 group-hover:translate-y-2 transition-transform duration-700" />
            <div className="overflow-hidden rounded-sm">
              <img
                src={exp2}
                alt="Cozy interior"
                className="w-full h-[300px] md:h-[550px] object-cover group-hover:scale-110 transition-transform duration-[2s] ease-out grayscale-[10%]"
              />
            </div>
          </motion.div>
        </div>

        {/* Features with Timber Accents */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-20">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.2 }}
              className="group"
            >
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-bold text-primary/40 group-hover:text-primary transition-colors">0{i + 1}</span>
                <div className="h-px flex-1 bg-primary/20 group-hover:bg-primary/50 transition-all duration-700" />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-6 group-hover:text-primary transition-colors duration-500">
                {feature.title}
              </h3>
              <p className="text-foreground/60 font-sans text-base leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {showViewMore && (
          <div className="mt-24 text-center">
            <a
              href="/experience"
              className="inline-flex items-center gap-6 px-12 py-4 border border-primary/30 text-primary uppercase tracking-[0.4em] text-[10px] font-black hover:bg-primary hover:text-background transition-all duration-500 group overflow-hidden relative"
            >
              <span className="relative z-10">Explore Our Full Philosophy</span>
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExperienceSection;
