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
    <footer className="bg-forest-deep text-gold px-4 py-6 md:px-12 md:py-12 font-sans border-t border-gold/10" id="contact">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar: Brand & Action Buttons */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gold/10">
          <div className="flex flex-col">
            <h3 className="text-[12px] md:text-lg tracking-wider uppercase font-serif font-medium text-gold/90 leading-tight">
              The House of
            </h3>
            <span className="text-[8px] md:text-xs tracking-[0.3em] font-bold text-gold/60 uppercase">
              EARTHMONK
            </span>
          </div>

          <div className="flex gap-1.5 md:gap-3">
            <a
              href="/reserve"
              className="px-3 md:px-6 py-1 border border-gold/30 hover:bg-gold/10 transition-colors text-[8px] md:text-[10px] tracking-[0.2em] font-bold"
            >
              BOOK
            </a>
            <a
              href="/track"
              className="px-3 md:px-6 py-1 border border-gold/30 hover:bg-gold/10 transition-colors text-[8px] md:text-[10px] tracking-[0.2em] font-bold"
            >
              TRACK
            </a>
          </div>
        </div>

        {/* Link Grid: Extreme Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 md:gap-y-6 mb-6 md:mb-10 px-1">
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2">
              <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-gold/30 font-bold">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-1.5 md:gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[11px] md:text-sm text-gold/80 hover:text-gold transition-colors duration-300 uppercase tracking-widest font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Socials Column */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-gold/30 font-bold">
              Follow Us
            </h4>
            <div className="flex gap-3">
              <a href="https://instagram.com" className="text-gold/60 hover:text-gold transition-colors"><Instagram size={16} /></a>
              <a href="https://facebook.com" className="text-gold/60 hover:text-gold transition-colors"><Facebook size={16} /></a>
              <a href="https://twitter.com" className="text-gold/60 hover:text-gold transition-colors"><Twitter size={16} /></a>
            </div>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="pt-4 border-t border-gold/10 text-center flex flex-col items-center gap-2">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-gold/50">
              Crafted with Soul
            </p>
            <p className="text-[8px] text-gold/20 tracking-widest uppercase">
              © 2024 The House of Earthmonk
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
