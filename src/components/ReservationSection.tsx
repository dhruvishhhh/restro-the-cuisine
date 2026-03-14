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
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { normalizeTimeTo24h } from "@/lib/timeSlots";

const guestOptions = ["1", "2", "3", "4", "5", "6", "7", "8+"];

const ReservationSection = ({ fullPage = false }: { fullPage?: boolean }) => {
  const [locations, setLocations] = useState<any[]>([]);
  const ref = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState("default");
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
    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "reservations"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsPaused(data.isPaused || false);
          setPauseReason(data.pauseReason || "default");
        } else {
          setIsPaused(false);
          setPauseReason("default");
        }
      },
      (error) => {
        console.error("Error listening to settings/reservations:", error);
      }
    );

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

  let timeSlots = [];
  for (let hour = 11; hour <= 22; hour++) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    timeSlots.push(`${displayHour}:00 ${period}`);
    timeSlots.push(`${displayHour}:30 ${period}`);
  }

  if (date && isSameDay(date, new Date())) {
      const now = new Date();
      const currentTotalMin = now.getHours() * 60 + now.getMinutes();

      timeSlots = timeSlots.filter(slot => {
          const normalizedTime = normalizeTimeTo24h(slot);
          const [h, m] = normalizedTime.split(":").map(Number);
          const slotTotalMin = h * 60 + m;
          // Only show slots that are AT LEAST 15 minutes in the future to allow booking
          return slotTotalMin > currentTotalMin + 15;
      });
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

      setTimeout(() => navigate("/"), 6000);
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

  /* ── Shared style tokens (same font as desktop) ── */
  const labelClasses = "block text-[10px] uppercase tracking-[0.2em] text-gold/60 mb-2 font-sans font-bold";
  const inputClasses =
    "w-full bg-transparent border-b border-primary-foreground/10 py-3 md:py-4 text-primary-foreground font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300";
  const selectClasses =
    "w-full bg-transparent border-b border-primary-foreground/10 py-3 md:py-4 text-primary-foreground font-sans text-sm focus:outline-none focus:border-gold transition-colors duration-300 appearance-none cursor-pointer";

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-primary border border-gold/20 p-8 md:p-12 rounded-xl text-center max-w-2xl mx-auto backdrop-blur-sm my-6 md:my-12"
      >
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border border-gold/30">
          <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-gold animate-pulse" />
        </div>
        <h3 className="section-heading text-xl md:text-2xl mb-3 md:mb-4 text-primary-foreground">Request Sent Successfully</h3>
        <p className="text-primary-foreground/80 font-sans leading-relaxed mb-4 text-sm">
          The House of Earthmonk request has been submitted. <span className="text-gold font-bold">You will receive a confirmation or status update email shortly</span> once our monks review the schedule.
        </p>
        <p className="text-gold/60 text-[10px] uppercase tracking-widest mt-6 md:mt-8">
          Redirecting to home in a moment...
        </p>
      </motion.div>
    );
  }

  return (
    <section className={`${fullPage ? 'py-0 md:py-12 lg:py-24' : 'section-padding'} bg-primary`} id="reserve" ref={ref}>
      <div className={`${fullPage ? 'max-w-7xl' : 'max-w-3xl'} mx-auto px-2 md:px-6`}>
        {!fullPage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="section-subheading text-gold/80">Reservations</span>
            <h2 className="section-heading text-primary-foreground mt-4">Reserve Your Table</h2>
            <p className="text-primary-foreground/50 font-sans text-sm mt-4 max-w-md mx-auto">
              Join us for an experience that nourishes body and soul.
            </p>
          </motion.div>
        )}

        <div className={`relative ${fullPage ? 'grid lg:grid-cols-5 gap-5 md:gap-16 items-start' : ''}`}>
          {/* ── Side Panel ── */}
          {fullPage && (
            <div className="lg:col-span-2 flex flex-col justify-center lg:pr-12 pb-4 md:pb-12 lg:pb-0 border-b lg:border-b-0 lg:border-r border-gold/10">

              {/* Mobile — minimal header + description */}
              <div className="md:hidden space-y-1.5 mb-1">
                <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold">Reserve a Table</span>
                <p className="text-primary-foreground/40 font-sans text-[11px] leading-relaxed">
                  Fill in the details below — you'll get a confirmation email once availability is reviewed.
                </p>
              </div>

              {/* Desktop — full panel */}
              <div className="hidden md:flex flex-col space-y-10">
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
            </div>
          )}

          {/* ── Form ── */}
          <div className={`${fullPage ? 'lg:col-span-3 pb-2 md:pb-12 lg:pb-0' : ''}`}>
            {isPaused && (
              <div className="absolute inset-0 z-50 bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center border border-gold/10">
                <ShieldOff className="w-12 h-12 text-gold mb-6" />
                <h3 className="section-heading text-primary-foreground text-2xl mb-4">
                  {pauseReason === "out_of_table" ? "No Tables Available" :
                    pauseReason === "no_booking_today" ? "No Reservations Accepted Today" :
                      "Reservations Unavailable"}
                </h3>
                <p className="text-primary-foreground/60 max-w-sm mb-8 font-sans leading-relaxed">
                  {pauseReason === "out_of_table"
                    ? "We have reached full capacity for this session. Please try again later or give us a call — we'd love to have you."
                    : pauseReason === "no_booking_today"
                      ? "We are not taking reservations at this time. We look forward to welcoming you on another day."
                      : "Online reservations are temporarily unavailable. Please reach out to us directly and we'll be happy to assist."}
                </p>
                <a href="tel:+911234567890" className="px-8 py-3 bg-gold text-primary font-bold uppercase tracking-widest text-xs inline-flex items-center gap-2">
                  <span>+91 12345 67890</span> — Call Us
                </a>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`grid grid-cols-2 gap-x-4 md:gap-x-10 gap-y-4 md:gap-y-10 transition-all duration-700 ${isPaused ? 'blur-sm opacity-20 pointer-events-none' : ''}`}
            >
              {/* Row 1 */}
              <div className="space-y-1">
                <label className={labelClasses}>Full Name</label>
                <input type="text" required className={inputClasses}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Email Address</label>
                <input type="email" required className={inputClasses}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Row 2 */}
              <div className="space-y-1">
                <label className={labelClasses}>Phone Number</label>
                <input type="tel" required className={inputClasses}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Location</label>
                <select required className={selectClasses}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  {locations.length === 0 ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.name} className="text-foreground bg-background">{loc.name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Row 3 */}
              <div className="space-y-1">
                <label className={labelClasses}>Select Date</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        inputClasses,
                        "text-left flex items-center justify-between",
                        !date && "text-primary-foreground/30"
                      )}
                    >
                      <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Pick a date"}</span>
                      <CalendarIcon className="h-4 w-4 opacity-40 shrink-0 ml-1" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[1002]" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setCalendarOpen(false);
                      }}
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
                <select required className={selectClasses}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="" disabled className="text-foreground bg-background">Select Time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="text-foreground bg-background">{time}</option>
                  ))}
                </select>
              </div>

              {/* Row 4 — full width */}
              <div className="space-y-1 col-span-2">
                <label className={labelClasses}>Number of Guests</label>
                <select required className={selectClasses}
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

              {/* Submit */}
              <div className="col-span-2 mt-1 md:mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-16 py-3 md:py-4 bg-gold text-primary uppercase tracking-[0.2em] text-sm font-sans font-bold hover:bg-gold/90 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 md:mx-0"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Requesting..." : "Request Reservation"}
                </button>

                {/* Mobile footer links */}
                <div className="flex items-center justify-between mt-3 md:hidden">
                  <a href="/track" className="text-[9px] uppercase tracking-[0.15em] text-gold/50 hover:text-gold transition-colors font-semibold">
                    Track existing request →
                  </a>
                  <span className="text-primary-foreground/20 text-[8px] uppercase tracking-wider">
                    Email confirms entry
                  </span>
                </div>

                {/* Desktop footer */}
                {!fullPage && (
                  <div className="mt-8 hidden md:block">
                    <a href="/track" className="text-[9px] uppercase tracking-[0.3em] text-primary-foreground/40 hover:text-gold transition-colors">
                      Already made a request? Track status here
                    </a>
                  </div>
                )}
                <p className="text-primary-foreground/30 font-sans text-[10px] uppercase tracking-[0.3em] mt-6 hidden md:block text-center">
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
