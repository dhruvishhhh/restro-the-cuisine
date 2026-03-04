import { motion } from "framer-motion";
import { Home, UtensilsCrossed, CalendarCheck, Phone } from "lucide-react";
import { useLocation } from "react-router-dom";

const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Menu", href: "/menu", icon: UtensilsCrossed },
    { label: "Reserve", href: "/reserve", icon: CalendarCheck, accent: true },
    { label: "Contact", href: "/contact", icon: Phone },
];

const MobileBottomNav = () => {
    const location = useLocation();

    return (
        <motion.nav
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-forest-deep/95 backdrop-blur-md border-t border-gold/10"
        >
            <div className="flex items-center justify-around py-2 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 min-w-[60px] ${item.accent
                                    ? "text-primary bg-gold rounded-xl px-4 py-2 shadow-lg shadow-gold/20 -mt-3"
                                    : isActive
                                        ? "text-gold"
                                        : "text-primary-foreground/50 hover:text-gold/80"
                                }`}
                        >
                            <Icon size={item.accent ? 20 : 18} strokeWidth={item.accent ? 2.5 : 2} />
                            <span className={`text-[9px] uppercase tracking-wider font-sans font-medium ${item.accent ? "text-primary font-bold" : ""
                                }`}>
                                {item.label}
                            </span>
                        </a>
                    );
                })}
            </div>
        </motion.nav>
    );
};

export default MobileBottomNav;
