import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import EarthMonkLogo from "./EarthMonkLogo";
import { useLocation } from "react-router-dom";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "MENU", href: "/menu" },
  { label: "EXPERIENCE", href: "/experience" },
  { label: "LOCATIONS", href: "/locations" },
  { label: "CONTACT", href: "/contact" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClasses = (linkHref: string) => {
    const isActive = location.pathname === linkHref;
    // Brown text ONLY when on a subpage (cream bg) and NOT scrolled
    const isLightBg = !scrolled && !isHomePage;

    return `text-[10px] uppercase tracking-[0.2em] font-sans font-bold transition-all duration-300 ${isLightBg
      ? "text-primary hover:text-gold"
      : "text-primary-foreground hover:text-gold"
      } ${isActive ? "text-gold" : ""}`;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-forest-deep/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <EarthMonkLogo className="w-12 h-12" />
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl font-bold tracking-wider text-gold group-hover:text-gold/80 transition-colors">
                EARTH MONK
              </span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-gold/60 -mt-1">
                SANCTUARY
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={navLinkClasses(link.href)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/reserve"
              className="ml-4 px-6 py-2.5 bg-gold text-primary font-bold text-[10px] uppercase tracking-[0.2em] rounded-sm hover:bg-gold/90 transition-all duration-300 shadow-lg shadow-gold/20"
            >
              Book A Table
            </a>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden ${scrolled || !isHomePage ? 'text-primary' : 'text-primary-foreground'}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-forest-deep/98 flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-lg uppercase tracking-[0.25em] font-sans text-primary-foreground/80 hover:text-gold transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="/reserve"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 px-8 py-3 bg-gold text-primary font-bold uppercase tracking-[0.2em] rounded-sm"
            >
              Book A Table
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
