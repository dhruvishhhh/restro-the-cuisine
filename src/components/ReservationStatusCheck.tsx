import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Calendar, Users, Clock, MapPin, CheckCircle2, XCircle, Timer } from "lucide-react";

const ReservationStatusCheck = () => {
    const [phone, setPhone] = useState("");
    const [lastSearchedPhone, setLastSearchedPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;
        setLoading(true);
        setSearched(true);
        setLastSearchedPhone(phone);
        setResult(null);

        try {
            const q = query(
                collection(db, "reservations"),
                where("phone", "==", phone),
                orderBy("createdAt", "desc"),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setResult(querySnapshot.docs[0].data());
            }
        } catch (error) {
            console.error("Error checking status:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-8 h-8 text-green-500" />;
            case 'rejected': case 'cancelled': return <XCircle className="w-8 h-8 text-red-500" />;
            default: return <Timer className="w-8 h-8 text-gold animate-pulse" />;
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'approved': return "Your sanctuary is ready. We look forward to your arrival.";
            case 'rejected': case 'cancelled': return "The sanctuary is currently full for this slot. Please try another time.";
            default: return "Your request is being reviewed by our monks. Please check back shortly.";
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2 mb-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/40" />
                    <input
                        type="tel"
                        placeholder="Enter Phone Number"
                        className="w-full bg-primary/5 border border-gold/20 pl-12 pr-4 py-4 text-primary-foreground font-sans text-sm focus:outline-none focus:border-gold transition-all"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="px-8 bg-gold text-primary text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </button>
            </form>

            <AnimatePresence mode="wait">
                {searched && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-card/5 border border-gold/10 p-8 rounded-xl backdrop-blur-sm"
                    >
                        {result ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-gold/10 pb-4 mb-4">
                                    <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Registration Data</span>
                                    <span className="text-[10px] font-sans text-primary-foreground/60">Phone: {lastSearchedPhone}</span>
                                </div>
                                <div className="flex items-center gap-6 pb-6 border-b border-gold/10">
                                    {getStatusIcon(result.status)}
                                    <div>
                                        <h4 className="text-gold font-bold uppercase tracking-widest text-xs mb-1">
                                            Status: {result.status}
                                        </h4>
                                        <p className="text-primary-foreground/80 font-sans text-sm leading-relaxed">
                                            {getStatusMessage(result.status)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-primary-foreground/40">
                                            <Calendar className="w-3 h-3 text-gold/60" /> {result.date}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-primary-foreground/40">
                                            <Clock className="w-3 h-3 text-gold/60" /> {result.time}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-primary-foreground/40">
                                            <Users className="w-3 h-3 text-gold/60" /> {result.guests} Guests
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-primary-foreground/40">
                                            <MapPin className="w-3 h-3 text-gold/60" /> {result.location}
                                        </div>
                                    </div>
                                </div>

                                {result.tableNumber && result.status === 'approved' && (
                                    <div className="bg-gold/10 p-4 rounded text-center border border-gold/20">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Assigned Table: {result.tableNumber}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-primary-foreground/50 font-sans text-sm mb-8">No recent reservation found for {lastSearchedPhone}.</p>
                                <a
                                    href="/contact"
                                    className="inline-flex px-8 py-3 bg-gold text-primary text-[10px] uppercase tracking-widest font-bold hover:bg-gold/90 transition-all rounded-sm"
                                >
                                    Contact Sanctuary
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReservationStatusCheck;
