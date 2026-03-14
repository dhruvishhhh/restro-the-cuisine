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

const Header = ({ topOffset = false }: { topOffset?: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
        className={`fixed ${topOffset ? 'top-8' : 'top-0'} left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-forest-deep/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 md:px-12 py-3 md:py-4">

          <div className="flex items-center gap-2 md:gap-8">
            {/* Mobile Burger (Left) */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden relative z-[70] p-1.5 ${mobileOpen ? 'text-gold' : 'text-gold'}`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <EarthMonkLogo className="w-8 h-8 md:w-11 md:h-11" />
              <div className="flex flex-col">
                <span className="font-serif text-[11px] md:text-lg font-bold tracking-wider text-gold group-hover:text-gold/80 transition-colors">
                  RESTRO
                </span>
                <span className="text-[7px] md:text-[9px] font-serif font-black text-gold/90 -mt-1 tracking-[0.1em]">
                  GLOBAL CUISINE
                </span>
              </div>
            </a>
          </div>

          {/* Nav Links (Desktop Center-ish) */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={navLinkClasses(link.href)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons (Right) */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <a
              href="/reserve"
              className="px-3 md:px-6 py-1.5 md:py-2 border border-gold/40 text-gold font-bold text-[9px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-gold hover:text-primary transition-all duration-300"
            >
              BOOK
            </a>
            <a
              href="/track"
              className="hidden xs:block px-3 md:px-6 py-1.5 md:py-2 border border-gold/40 text-gold font-bold text-[9px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-gold hover:text-primary transition-all duration-300"
            >
              TRACK
            </a>
          </div>

        </div>
      </motion.header>

      {/* Mobile Menu — Full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-forest-deep/[0.98] backdrop-blur-sm flex flex-col items-center justify-center"
          >
            {/* Close button at top-right */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-gold/80 hover:text-gold transition-colors z-[70]"
              aria-label="Close menu"
            >
              <X size={28} />
            </button>

            {/* Nav Links */}
            <nav className="flex flex-col items-center gap-6">
              {navLinks.map((link, i) => {
                const isActive = location.pathname === link.href;
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`text-base uppercase tracking-[0.25em] font-sans font-medium transition-colors ${isActive ? "text-gold" : "text-primary-foreground/70 hover:text-gold"
                      }`}
                  >
                    {link.label}
                  </motion.a>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-12 h-px bg-gold/30 my-2"
              />
              <motion.a
                href="/reserve"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="px-8 py-3 bg-gold text-primary font-bold text-xs uppercase tracking-[0.2em] rounded-sm shadow-lg shadow-gold/20 hover:bg-gold/90 transition-all"
              >
                Book A Table
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
