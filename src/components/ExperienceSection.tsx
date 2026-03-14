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
    <section className="section-padding bg-primary" id="experience" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-24"
        >
          <span className="section-subheading text-gold/80">The Experience</span>
          <h2 className="section-heading text-primary-foreground mt-4">
            A Global Cuisine Experience for the Senses
          </h2>
        </motion.div>

        {/* Image Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="overflow-hidden"
          >
            <img
              src={exp1}
              alt="Golden pawn dant lights over wooden tables with plants"
              className="w-full h-[220px] md:h-[450px] object-cover hover:scale-105 transition-transform duration-700 rounded-sm"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="overflow-hidden"
          >
            <img
              src={exp2}
              alt="Cozy bamboo lounge with tropical plants"
              className="w-full h-[220px] md:h-[450px] object-cover hover:scale-105 transition-transform duration-700 rounded-sm"
            />
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="text-center"
            >
              <div className="w-8 h-px bg-gold mx-auto mb-6" />
              <h3 className="font-serif text-xl md:text-2xl text-primary-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/60 font-sans text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {showViewMore && (
          <div className="mt-16 text-center">
            <a
              href="/experience"
              className="inline-flex items-center gap-4 px-10 py-3 border border-gold/30 text-gold uppercase tracking-[0.3em] text-xs font-bold hover:bg-gold/10 transition-all group"
            >
              Exlpore More Details
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExperienceSection;
