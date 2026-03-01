import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const locations = ["Indiranagar, Bangalore", "Koramangala, Bangalore", "Bandra West, Mumbai"];
const guestOptions = ["1", "2", "3", "4", "5", "6", "7", "8+"];

const ReservationSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    date: "",
    time: "",
    guests: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend only — will integrate with backend
    alert("Thank you! Your reservation request has been received. We'll confirm shortly.");
  };

  const inputClasses =
    "w-full bg-transparent border-b border-primary-foreground/20 py-3 text-primary-foreground font-sans text-sm placeholder:text-primary-foreground/30 focus:outline-none focus:border-gold transition-colors duration-300";

  const selectClasses =
    "w-full bg-transparent border-b border-primary-foreground/20 py-3 text-primary-foreground font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300 appearance-none cursor-pointer";

  return (
    <section className="section-padding bg-primary" id="reserve" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="section-subheading text-gold/80">Reservations</span>
          <h2 className="section-heading text-primary-foreground mt-4">
            Reserve Your Table
          </h2>
          <p className="text-primary-foreground/50 font-sans text-sm mt-4 max-w-md mx-auto">
            Join us for an experience that nourishes body and soul. Tables are limited to preserve the intimacy of your visit.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-x-8 gap-y-6"
        >
          <input
            type="text"
            placeholder="Full Name"
            required
            className={inputClasses}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            className={inputClasses}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            required
            className={inputClasses}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <select
            required
            className={selectClasses}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          >
            <option value="" disabled className="text-foreground bg-background">
              Select Location
            </option>
            {locations.map((loc) => (
              <option key={loc} value={loc} className="text-foreground bg-background">
                {loc}
              </option>
            ))}
          </select>
          <input
            type="date"
            required
            className={inputClasses}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <input
            type="time"
            required
            className={inputClasses}
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
          <select
            required
            className={`${selectClasses} md:col-span-2`}
            value={formData.guests}
            onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
          >
            <option value="" disabled className="text-foreground bg-background">
              Number of Guests
            </option>
            {guestOptions.map((g) => (
              <option key={g} value={g} className="text-foreground bg-background">
                {g} {g === "1" ? "Guest" : "Guests"}
              </option>
            ))}
          </select>

          <div className="md:col-span-2 text-center mt-8">
            <button
              type="submit"
              className="px-12 py-4 border border-gold/60 text-gold uppercase tracking-[0.2em] text-sm font-sans font-medium hover:bg-gold/10 transition-all duration-500"
            >
              Request Reservation
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default ReservationSection;
