import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin } from "lucide-react";

const locations = [
  {
    name: "Anand",
    city: "Gujarat",
    address: "The House of Earthmonk, near Amul Dairy Road",
    hours: "11:00 AM – 11:00 PM",
    mapLink: "https://maps.app.goo.gl/x8ZDg1hwzR7gSJUv6"
  },
  {
    name: "Vadodara",
    city: "Gujarat",
    address: "The House of Earthmonk, Vadodara",
    hours: "11:00 AM – 11:00 PM",
    mapLink: "https://maps.app.goo.gl/pzJaAyTHi8DjG1nM7"
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
          className="text-center mb-10 md:mb-16"
        >
          <span className="section-subheading">Visit Us</span>
          <h2 className="section-heading text-foreground mt-4">Our Sanctuary</h2>
        </motion.div>

        <div className="flex justify-center">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border border-border p-8 hover:border-gold/40 transition-colors duration-500 group max-w-md w-full text-center"
            >
              <MapPin className="w-5 h-5 text-gold mb-6 mx-auto" />
              <h3 className="font-serif text-2xl text-foreground mb-1">
                {loc.name}
              </h3>
              <p className="text-muted-foreground font-sans text-sm mb-4">
                {loc.city}
              </p>
              <div className="w-8 h-px bg-border group-hover:bg-gold/40 transition-colors duration-500 mb-4 mx-auto" />
              <p className="text-muted-foreground font-sans text-sm mb-2">
                {loc.address}
              </p>
              <p className="text-muted-foreground font-sans text-xs uppercase tracking-wider mb-6">
                {loc.hours}
              </p>
              <a
                href={loc.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2 px-6 border border-gold/20 text-gold uppercase tracking-[0.2em] text-[10px] font-sans font-bold hover:bg-gold/10 transition-all"
              >
                View Map
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
