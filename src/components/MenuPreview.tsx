import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import menu1 from "@/assets/menu-1.jpg";
import menu2 from "@/assets/menu-2.jpg";
import menu3 from "@/assets/menu-3.jpg";

const menuItems = [
  {
    image: menu1,
    title: "Earth Bowl",
    description: "Seasonal vegetables, heritage grains, cashew cream",
    price: "₹480",
    alt: "Elegant plated dish with seasonal vegetables",
  },
  {
    image: menu2,
    title: "Ceremonial Matcha",
    description: "Stone-ground Uji matcha, oat milk, wild honey",
    price: "₹320",
    alt: "Matcha latte in handmade ceramic bowl",
  },
  {
    image: menu3,
    title: "Sourdough & Honey",
    description: "48-hour fermented sourdough, raw forest honey",
    price: "₹280",
    alt: "Artisan sourdough bread with honey",
  },
];

const MenuPreview = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding" id="menu" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="section-subheading">The Menu</span>
          <h2 className="section-heading text-foreground mt-4">
            Curated with Intention
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="group cursor-pointer"
            >
              <div className="overflow-hidden mb-6">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-[350px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-sans">
                    {item.description}
                  </p>
                </div>
                <span className="text-accent font-sans font-medium text-sm shrink-0">
                  {item.price}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <a
            href="#"
            className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-sans font-medium text-accent hover:text-gold transition-colors duration-300"
          >
            View Full Menu
            <span className="w-8 h-px bg-current" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default MenuPreview;
