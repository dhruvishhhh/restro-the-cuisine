import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { motion } from "framer-motion";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <BackButton />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 text-center"
                    >
                        <h1 className="section-heading text-4xl md:text-5xl lg:text-6xl mb-6">Terms of Service</h1>
                        <p className="text-muted-foreground font-sans">Last Updated: March 2, 2026</p>
                    </motion.div>

                    <div className="prose prose-gold prose-invert max-w-none space-y-12 text-primary/80 font-sans leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">1. Respect for the Sanctuary</h2>
                            <p>
                                By accessing the Earth Monk Sanctuary website, you agree to treat this digital space with respect.
                                Our content is a reflection of our soul; please do not reproduce or use our imagery without permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">2. Reservation Etiquette</h2>
                            <p>
                                A reservation request is a gesture of intent. While we strive to honor every request, a booking is only confirmed
                                once you receive an approval notification. We reserve the right to modify or cancel reservations to maintain sanctuary balance.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">3. Conduct of Peace</h2>
                            <p>
                                Guests visiting our physical locations are expected to maintain a peaceful demeanor. We reserve the right
                                to refuse entry to anyone whose conduct disturbs the tranquility of our other guests.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">4. Limitation of Liability</h2>
                            <p>
                                While we provide a nourishing experience, Earth Monk Sanctuary is not liable for disruptions beyond our control.
                                We provide our services "as is" and encourage you to embrace the flow of the experience.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
