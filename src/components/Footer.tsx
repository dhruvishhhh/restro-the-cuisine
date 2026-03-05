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
    <footer className="bg-forest-deep text-gold px-6 py-10 md:px-12 md:py-20 font-serif border-t border-gold/10" id="contact">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar: Brand & Action Buttons */}
        <div className="flex justify-between items-center mb-10 pb-10 border-b border-gold/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-gold/40 flex items-center justify-center font-serif text-lg tracking-tighter pt-1">
              EM
            </div>
            <h3 className="text-lg md:text-xl tracking-wider uppercase font-medium">
              Earthmonk
            </h3>
          </div>

          <div className="flex gap-2 md:gap-4">
            <a
              href="/reserve"
              className="px-4 md:px-8 py-2 border border-gold/30 hover:bg-gold/10 transition-colors text-[10px] md:text-xs tracking-[0.2em] font-bold"
            >
              BOOK
            </a>
            <a
              href="/track"
              className="px-4 md:px-8 py-2 border border-gold/30 hover:bg-gold/10 transition-colors text-[10px] md:text-xs tracking-[0.2em] font-bold"
            >
              TRACK
            </a>
          </div>
        </div>

        {/* Link Grid: 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 mb-16 px-2">
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold/40 font-sans font-bold">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-lg md:text-xl text-gold/80 hover:text-gold transition-colors duration-300 font-serif lowercase italic first-letter:uppercase"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Socials Column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold/40 font-sans font-bold">
              Follow Us
            </h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" className="text-gold/60 hover:text-gold transition-colors"><Instagram size={20} /></a>
              <a href="https://facebook.com" className="text-gold/60 hover:text-gold transition-colors"><Facebook size={20} /></a>
              <a href="https://twitter.com" className="text-gold/60 hover:text-gold transition-colors"><Twitter size={20} /></a>
            </div>
          </div>
        </div>

        {/* Bottom Branding & Seal */}
        <div className="pt-10 border-t border-gold/10 text-center flex flex-col items-center gap-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] font-sans font-bold text-gold/60">
              Crafted with Soul
            </p>
            <p className="text-[10px] text-gold/30 font-sans tracking-widest">
              © 2024 The House of Earthmonk. All rights reserved.
            </p>
          </div>

          {/* Brand Seal */}
          <div className="mt-8 opacity-20 relative">
            <div className="w-32 h-32 md:w-40 md:h-40 border border-gold/40 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 border border-gold/10 rounded-full scale-[0.85]" />
              <div className="text-4xl md:text-5xl tracking-tighter font-serif select-none pt-2">
                EM
              </div>
            </div>
            <div className="absolute -inset-4 border border-gold/5 rounded-full animate-[spin_20s_linear_infinite] border-dashed" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
