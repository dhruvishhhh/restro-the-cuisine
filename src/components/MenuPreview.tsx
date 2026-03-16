import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import menu1 from "@/assets/menu-1.jpg";
import menu2 from "@/assets/menu-2.jpg";
import menu3 from "@/assets/menu-3.jpg";

const menuItems = [
  {
    image: menu1,
    title: "Paneer Tikka Masala",
    description: "Cottage cheese cubes cooked in a rich, spiced tomato and butter gravy",
    price: "₹380",
    alt: "Rich paneer tikka masala dish",
  },
  {
    image: menu2,
    title: "Classic Margherita Pizza",
    description: "Wood-fired crust with San Marzano tomatoes, fresh mozzarella, and basil",
    price: "₹450",
    alt: "Wood-fired Margherita pizza",
  },
  {
    image: menu3,
    title: "Vegetable Hakka Noodles",
    description: "Wok-tossed noodles with fresh assorted vegetables and soy sauce",
    price: "₹320",
    alt: "Wok-tossed hakka noodles",
  },
];

interface MenuPreviewProps {
  showViewMore?: boolean;
}

const MenuPreview = ({ showViewMore = false }: MenuPreviewProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding bg-background relative overflow-hidden" id="menu" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-16"
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
                  className="w-full h-[200px] md:h-[350px] object-cover group-hover:scale-105 transition-transform duration-700 rounded-sm"
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
            href={showViewMore ? "/menu" : "/reserve"}
            className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-sans font-medium text-primary hover:text-primary/80 transition-colors duration-300"
          >
            {showViewMore ? "View All Dishes" : "Request Reservation"}
            <span className="w-8 h-px bg-current" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default MenuPreview;
