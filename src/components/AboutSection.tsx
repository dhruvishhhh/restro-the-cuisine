import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import aboutImg from "@/assets/about-coffee.jpg";
import { ArrowRight } from "lucide-react";

interface AboutSectionProps {
  showViewMore?: boolean;
}

const AboutSection = ({ showViewMore = false }: AboutSectionProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding" id="about" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 md:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="overflow-hidden"
          >
            <img
              src={aboutImg}
              alt="Artisan coffee being poured with latte art"
              className="w-full h-[280px] md:h-[600px] object-cover rounded-sm"
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <span className="section-subheading">Our Story</span>
            <h2 className="section-heading text-foreground">
              Where Earth
              <br />
              Meets Craft
            </h2>
            <div className="w-12 h-px bg-gold" />
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg font-sans">
              Born from a deep reverence for the earth and the art of mindful
              dining, House of Earth Monk is a sanctuary where every detail —
              from the bamboo ceilings to the hand-thrown ceramics — tells a
              story of conscious creation.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg font-sans">
              Our philosophy is simple: source with integrity, craft with soul,
              and serve with warmth. Every ingredient is thoughtfully chosen,
              every dish a meditation on flavor and form.
            </p>

            {showViewMore ? (
              <a
                href="/about"
                className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-sans font-bold text-accent hover:text-gold transition-colors duration-300 mt-4 group"
              >
                Read Fully
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <a
                href="/reserve"
                className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-sans font-medium text-accent hover:text-gold transition-colors duration-300 mt-4"
              >
                Discover More
                <span className="w-8 h-px bg-current" />
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
