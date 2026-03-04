import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import exp1 from "@/assets/experience-1.jpg";
import exp2 from "@/assets/experience-2.jpg";
import heroBg from "@/assets/hero-bg.jpg";
import aboutImg from "@/assets/about-coffee.jpg";
import menu1 from "@/assets/menu-1.jpg";
import menu2 from "@/assets/menu-2.jpg";

const images = [exp1, exp2, heroBg, aboutImg, menu1, menu2];

const InstagramGrid = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 px-6"
      >
        <span className="section-subheading">@houseofearth.monk</span>
        <h2 className="section-heading text-foreground mt-4">
          Follow the Journey
        </h2>
      </motion.div>

      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="aspect-square overflow-hidden group cursor-pointer"
          >
            <img
              src={img}
              alt={`Instagram post ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter saturate-[0.85] group-hover:saturate-100"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default InstagramGrid;
