import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin } from "lucide-react";

const locations = [
  {
    name: "Indiranagar",
    city: "Bangalore",
    address: "12th Main, HAL 2nd Stage",
    hours: "8:00 AM – 11:00 PM",
  },
  {
    name: "Koramangala",
    city: "Bangalore",
    address: "80 Feet Road, 4th Block",
    hours: "8:00 AM – 11:00 PM",
  },
  {
    name: "Bandra West",
    city: "Mumbai",
    address: "Hill Road, Near Linking Road",
    hours: "9:00 AM – 11:00 PM",
  },
];

const LocationsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding bg-card" id="locations" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="section-subheading">Find Us</span>
          <h2 className="section-heading text-foreground mt-4">Our Locations</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="border border-border p-8 hover:border-gold/40 transition-colors duration-500 group"
            >
              <MapPin className="w-5 h-5 text-gold mb-6" />
              <h3 className="font-serif text-2xl text-foreground mb-1">
                {loc.name}
              </h3>
              <p className="text-muted-foreground font-sans text-sm mb-4">
                {loc.city}
              </p>
              <div className="w-8 h-px bg-border group-hover:bg-gold/40 transition-colors duration-500 mb-4" />
              <p className="text-muted-foreground font-sans text-sm mb-2">
                {loc.address}
              </p>
              <p className="text-muted-foreground font-sans text-xs uppercase tracking-wider">
                {loc.hours}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
