import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";

const TrackSection = () => {
    return (
        <section className="py-24 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-forest-deep rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                    <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <span className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block">Reservation Status</span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-primary-foreground mb-6 leading-tight">
                                Track Your <br className="hidden md:block" /> Sanctuary Request
                            </h2>
                            <p className="text-primary-foreground/60 font-sans text-sm md:text-base mb-8 max-w-md">
                                Enter your phone number to check the real-time status of your table reservation and view assigned seating.
                            </p>
                            <a
                                href="/track"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-primary font-bold uppercase tracking-widest text-xs rounded-sm hover:translate-x-2 transition-all duration-300 group"
                            >
                                Check Now
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>

                        <div className="w-full md:w-1/3 flex justify-center">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-gold/20 flex items-center justify-center relative">
                                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border border-gold/10 flex items-center justify-center animate-pulse">
                                    <Search className="w-12 h-12 md:w-16 md:h-16 text-gold/20" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg">
                                    <span className="text-[10px] text-primary font-bold">LIVE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrackSection;
