import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { motion } from "framer-motion";

const Privacy = () => {
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
                        <h1 className="section-heading text-4xl md:text-5xl lg:text-6xl mb-6">Privacy Policy</h1>
                        <p className="text-muted-foreground font-sans">Effective Date: March 2, 2026</p>
                    </motion.div>

                    <div className="prose prose-gold prose-invert max-w-none space-y-12 text-primary/80 font-sans leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">1. Protection of Data</h2>
                            <p>
                                At Restro Global Cuisine, we treat your personal information with the utmost respect.
                                We only collect what is necessary to facilitate your journey with us—specifically your name, phone number, and dining preferences.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">2. Mindfulness in Collection</h2>
                            <p>
                                We collect information through our reservation system and contact forms. This data is used solely to manage your table bookings
                                and ensure we can reach you regarding any changes to your dining experience.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">3. Sacred Protection</h2>
                            <p>
                                Your data is stored in secure, encrypted environments. We do not sell, trade, or share your personal details with external merchants
                                or agents of commerce. Your presence here is personal and private.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif text-foreground mb-4">4. Your Right to Privacy</h2>
                            <p>
                                You may request the removal of your data from our records at any time. Simply reach out to us via
                                the contact page, and we will honor your request for privacy.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
