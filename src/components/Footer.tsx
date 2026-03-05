import { Instagram, Facebook, Twitter } from "lucide-react";

const footerLinks = [
  {
    heading: "Visit",
    links: [
      { label: "Menu", href: "/menu" },
      { label: "Locations", href: "/locations" },
      { label: "Book A Table", href: "/reserve" },
      { label: "Track Request", href: "/track" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Experience", href: "/experience" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Admin Login", href: "/admin/login" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-forest-deep text-gold px-4 py-8 md:px-12 md:py-20 font-sans border-t border-gold/10" id="contact">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar: Brand & Action Buttons */}
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gold/10">
          <div className="flex flex-col">
            <h3 className="text-sm md:text-xl tracking-wider uppercase font-serif font-medium text-gold/90">
              The House of
            </h3>
            <span className="text-[10px] md:text-sm tracking-[0.3em] font-bold text-gold/60 -mt-1 uppercase">
              EARTHMONK
            </span>
          </div>

          <div className="flex gap-2">
            <a
              href="/reserve"
              className="px-4 md:px-8 py-2 border border-gold/30 hover:bg-gold/10 transition-colors text-[9px] md:text-xs tracking-[0.2em] font-bold"
            >
              BOOK
            </a>
            <a
              href="/track"
              className="px-4 md:px-8 py-2 border border-gold/30 hover:bg-gold/10 transition-colors text-[9px] md:text-xs tracking-[0.2em] font-bold"
            >
              TRACK
            </a>
          </div>
        </div>

        {/* Link Grid: Ultra-compact on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 md:gap-y-8 mb-8 md:mb-16 px-1">
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold/40 font-bold">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2.5 md:gap-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] md:text-lg text-gold/80 hover:text-gold transition-colors duration-300 uppercase tracking-widest font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Socials Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold/40 font-bold">
              Follow Us
            </h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" className="text-gold/60 hover:text-gold transition-colors"><Instagram size={18} /></a>
              <a href="https://facebook.com" className="text-gold/60 hover:text-gold transition-colors"><Facebook size={18} /></a>
              <a href="https://twitter.com" className="text-gold/60 hover:text-gold transition-colors"><Twitter size={18} /></a>
            </div>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="pt-6 border-t border-gold/10 text-center flex flex-col items-center gap-3">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold/60">
              Crafted with Soul
            </p>
            <p className="text-[9px] text-gold/30 tracking-widest uppercase">
              © 2024 The House of Earthmonk
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
