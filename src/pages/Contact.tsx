import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

const Contact = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 text-left">
                    <BackButton />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <span className="section-subheading">Get in Touch</span>
                        <h1 className="section-heading mt-4 text-4xl md:text-5xl lg:text-6xl">Contact Us</h1>
                    </motion.div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 mb-20">
                            {/* Contact Info */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="space-y-10"
                            >
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-serif text-foreground">Restro Global Cuisine Bar & Bistro</h3>
                                    <p className="text-muted-foreground font-sans leading-relaxed">
                                        Located in Anand, we welcome you to experience a wonderful dining journey.
                                        Reach out to us directly for any inquiries.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <a
                                        href="https://maps.app.goo.gl/x8ZDg1hwzR7gSJUv6"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex gap-6 group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-widest text-gold mb-1 font-bold">Anand Location</h4>
                                            <p className="text-foreground font-sans group-hover:text-gold transition-colors">Lambhvel Road, Opp. Hero Showroom,<br />Near Hanuman Temple, Vallabh Vidyanagar / Lambhvel,<br />Anand, Gujarat – 387310</p>
                                        </div>
                                    </a>

                                    <a href="tel:+917600600727" className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-widest text-gold mb-1 font-bold">Call Us</h4>
                                            <p className="text-foreground font-sans group-hover:text-gold transition-colors">+91 76006 00727</p>
                                        </div>
                                    </a>

                                    <a href="mailto:info@restro.the.cuisine" className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-widest text-gold mb-1 font-bold">Email Us</h4>
                                            <p className="text-foreground font-sans group-hover:text-gold transition-colors">info@restro.the.cuisine</p>
                                        </div>
                                    </a>
                                </div>
                            </motion.div>

                            {/* Review & Socials */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="bg-card/5 border border-gold/10 p-10 rounded-2xl backdrop-blur-sm self-start"
                            >
                                <h3 className="text-2xl font-serif text-foreground mb-6">Rate Your Experience</h3>
                                <p className="text-muted-foreground font-sans text-sm mb-8 leading-relaxed">
                                    Your feedback helps us grow and improve the Restro Global Cuisine experience for everyone.
                                </p>

                                <div className="space-y-4">
                                    <a
                                        href="https://google.com/maps"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 border border-gold/20 text-gold uppercase tracking-[0.2em] text-[10px] font-sans font-bold hover:bg-gold/5 transition-all text-center block"
                                    >
                                        Rate us on Google
                                    </a>
                                    <a
                                        href="https://instagram.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 border border-gold/20 text-gold uppercase tracking-[0.2em] text-[10px] font-sans font-bold hover:bg-gold/5 transition-all text-center block"
                                    >
                                        Follow on Instagram
                                    </a>
                                </div>

                                <div className="mt-12 pt-8 border-t border-gold/5">
                                    <div className="flex gap-6">
                                        <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold/60 shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-widest text-gold/60 mb-1 font-bold">Hours</h4>
                                            <p className="text-foreground/70 text-xs font-sans">11:00 AM – 11:00 PM Daily</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
