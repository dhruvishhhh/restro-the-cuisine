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
    <section className="h-[100dvh] md:h-auto section-padding bg-timber/30 relative overflow-hidden flex items-center" id="about" ref={ref}>
      {/* Texture background */}
      <div className="absolute inset-0 mesh-pattern opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 border border-primary/20 rounded-sm -z-10 translate-x-4 translate-y-4" />
            <img
              src={aboutImg}
              alt="Artisan coffee being poured with latte art"
              className="w-full h-[320px] md:h-[650px] object-cover rounded-sm shadow-2xl grayscale-[10%] contrast-[105%]"
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2">
              <span className="section-subheading text-primary">Our Story</span>
              <h2 className="section-heading text-foreground leading-tight">
                Where Earth
                <br />
                <span className="italic">Meets Craft</span>
              </h2>
            </div>

            <div className="w-16 h-px bg-primary/40" />

            <div className="space-y-6">
              <p className="text-foreground/80 leading-relaxed text-base md:text-xl font-sans font-light">
                Born from a deep appreciation for global culinary traditions,
                Restro Global Cuisine Bar & Bistro is a space where every detail —
                from the bamboo ceilings to the hand-thrown ceramics — tells a
                story of conscious creation.
              </p>
              <p className="text-foreground/70 leading-relaxed text-sm md:text-lg font-sans font-light italic">
                Our philosophy is simple: source with integrity, craft with soul,
                and serve with warmth. Every ingredient is thoughtfully chosen,
                every dish a meditation on flavor and form.
              </p>
            </div>

            {showViewMore ? (
              <a
                href="/about"
                className="inline-flex items-center gap-4 text-xs uppercase tracking-[0.3em] font-sans font-bold text-primary hover:gap-6 transition-all duration-500 mt-6 group"
              >
                Read Fully
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <a
                href="/reserve"
                className="inline-flex items-center gap-4 text-sm uppercase tracking-[0.3em] font-sans font-medium text-primary hover:gap-6 transition-all duration-500 mt-6 group"
              >
                Discover More
                <span className="w-12 h-px bg-current opacity-30 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
