import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldOff, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const guestOptions = ["1", "2", "3", "4", "5", "6", "7", "8+"];

const ReservationSection = ({ fullPage = false }: { fullPage?: boolean }) => {
  const [locations, setLocations] = useState<any[]>([]);
  const ref = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    time: "",
    guests: "",
  });

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "reservations"), (docSnap) => {
      if (docSnap.exists()) {
        setIsPaused(docSnap.data().isPaused || false);
      }
    });

    const unsubscribeLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
      const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setLocations(locs);
      if (locs.length > 0) {
        setFormData(prev => {
          if (!prev.location) return { ...prev, location: locs[0].name };
          return prev;
        });
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeLocations();
    };
  }, []);

  const timeSlots = [];
  for (let hour = 11; hour <= 23; hour++) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    timeSlots.push(`${displayHour}:00 ${period}`);
    if (hour < 23) timeSlots.push(`${displayHour}:30 ${period}`);
  }

  const validate = () => {
    if (/\d/.test(formData.name)) {
      toast({ variant: "destructive", title: "Invalid Name", description: "Name should not contain numbers." });
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      toast({ variant: "destructive", title: "Invalid Phone", description: "Phone number must be exactly 10 digits." });
      return false;
    }
    if (!date) {
      toast({ variant: "destructive", title: "Select Date", description: "Please pick a date for your visit." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "reservations"), {
        ...formData,
        date: date ? format(date, "yyyy-MM-dd") : "",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      toast({
        title: "Reservation Requested",
        description: "Your sanctuary request is being reviewed. Check status on our tracking page.",
      });

      setTimeout(() => navigate("/"), 2500);
    } catch (error: any) {
      console.error("Error saving reservation:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Sorry, something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const labelClasses = "block text-[10px] uppercase tracking-[0.2em] text-gold/60 mb-2 font-sans font-bold";
  const inputClasses =
    "w-full bg-transparent border-b border-primary-foreground/10 py-4 text-primary-foreground font-sans text-sm placeholder:text-primary-foreground/30 focus:outline-none focus:border-gold transition-colors duration-300";

  const selectClasses =
    "w-full bg-transparent border-b border-primary-foreground/10 py-4 text-primary-foreground font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300 appearance-none cursor-pointer";

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/5 border border-gold/20 p-12 rounded-xl text-center max-w-2xl mx-auto backdrop-blur-sm my-12"
      >
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/30">
          <Loader2 className="w-8 h-8 text-gold animate-pulse" />
        </div>
        <h3 className="section-heading text-2xl mb-4">Request Sent Successfully</h3>
        <p className="text-primary-foreground/70 font-sans leading-relaxed mb-4">
          Your sanctuary request has been submitted. <span className="text-gold font-bold">You will receive a confirmation or status update email shortly</span> once our monks review the schedule.
        </p>
        <p className="text-primary-foreground/40 text-[10px] uppercase tracking-widest mt-8">
          Redirecting to home in a moment...
        </p>
      </motion.div>
    );
  }

  return (
    <section className={`${fullPage ? 'py-12 md:py-24' : 'section-padding'} bg-primary`} id="reserve" ref={ref}>
      <div className={`${fullPage ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-6`}>
        {!fullPage && (
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
              Join us for an experience that nourishes body and soul.
            </p>
          </motion.div>
        )}

        <div className={`relative ${fullPage ? 'grid lg:grid-cols-5 gap-16 items-center' : ''}`}>
          {fullPage && (
            <div className="lg:col-span-2 flex flex-col justify-center space-y-10 lg:pr-12 md:pb-12 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gold/10">
              <div>
                <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold block mb-4">Reservation Form</span>
                <h2 className="section-heading text-primary-foreground text-5xl leading-tight">Secure Your<br />Private Corner</h2>
              </div>

              <div className="p-8 bg-gold/5 border border-gold/20 rounded-xl">
                <p className="text-primary-foreground/70 text-sm font-sans leading-relaxed italic">
                  Note: Upon submitting your request, our team will verify availability. <span className="text-gold block mt-2 font-bold not-italic underline">You will receive a status confirmation email once reviewed.</span>
                </p>
              </div>

              <div className="pt-4 border-t border-gold/10">
                <a href="/track" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold hover:underline font-bold transition-all">
                  Track Existing Request <ChevronDown className="w-3 h-3 -rotate-90" />
                </a>
              </div>
            </div>
          )}

          <div className={`${fullPage ? 'lg:col-span-3 pb-12 lg:pb-0' : ''}`}>
            {isPaused && (
              <div className="absolute inset-0 z-50 bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center border border-gold/10">
                <ShieldOff className="w-12 h-12 text-gold mb-6" />
                <h3 className="section-heading text-primary-foreground text-2xl mb-4">Reservations Paused</h3>
                <p className="text-primary-foreground/60 max-w-sm mb-8 font-sans">We are fully booked. Check status or call for urgent inquiry.</p>
                <a href="tel:+911234567890" className="px-8 py-3 bg-gold text-primary font-bold uppercase tracking-widest text-xs">Call For Inquiry</a>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`grid sm:grid-cols-2 gap-x-10 gap-y-12 transition-all duration-700 ${isPaused ? 'blur-sm opacity-20 pointer-events-none' : ''}`}
            >
              <div className="space-y-1">
                <label className={labelClasses}>Full Name</label>
                <input
                  type="text"
                  required
                  className={inputClasses}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Email Address</label>
                <input
                  type="email"
                  required
                  className={inputClasses}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Phone Number</label>
                <input
                  type="tel"
                  required
                  className={inputClasses}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Location</label>
                <select
                  required
                  className={selectClasses}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  {locations.length === 0 ? (
                    <option value="" disabled>Loading locations...</option>
                  ) : (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.name} className="text-foreground bg-background">{loc.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        inputClasses,
                        "text-left flex items-center justify-between",
                        !date && "text-primary-foreground/30"
                      )}
                    >
                      {date ? format(date, "PPP") : "Pick a date"}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[1002]" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0)) || date > new Date(new Date().setMonth(new Date().getMonth() + 1))
                      }
                      initialFocus
                      className="bg-primary border-gold/20 text-primary-foreground"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Preferred Time</label>
                <select
                  required
                  className={selectClasses}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="" disabled className="text-foreground bg-background">Select Time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="text-foreground bg-background">{time}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className={labelClasses}>Number of Guests</label>
                <select
                  required
                  className={selectClasses}
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                >
                  <option value="" disabled className="text-foreground bg-background">Select Guests</option>
                  {guestOptions.map((g) => (
                    <option key={g} value={g} className="text-foreground bg-background">
                      {g} {g === "1" ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 text-center mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-16 py-4 bg-gold text-primary uppercase tracking-[0.2em] text-sm font-sans font-bold hover:bg-gold/90 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Requesting..." : "Request Reservation"}
                </button>
                {!fullPage && (
                  <div className="mt-8">
                    <a href="/track" className="text-[9px] uppercase tracking-[0.3em] text-primary-foreground/40 hover:text-gold transition-colors">
                      Already made a request? Track status here
                    </a>
                  </div>
                )}
                <p className="text-primary-foreground/30 font-sans text-[10px] uppercase tracking-[0.3em] mt-8">
                  Email confirmation is mandatory for entry.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;
