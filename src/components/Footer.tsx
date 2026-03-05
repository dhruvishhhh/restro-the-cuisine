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
    <footer className="bg-forest-deep text-gold px-6 py-10 md:px-12 md:py-20 font-sans border-t border-gold/10 min-h-screen flex flex-col justify-between" id="contact">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Top Bar: Brand & Action Buttons */}
        <div className="flex justify-between items-center mb-12 pb-8 border-b border-gold/10">
          <div className="flex flex-col">
            <h3 className="text-lg md:text-2xl tracking-wider uppercase font-serif font-medium text-gold/90 leading-tight">
              The House of
            </h3>
            <span className="text-xs md:text-sm tracking-[0.4em] font-bold text-gold/50 uppercase mt-1">
              EARTHMONK
            </span>
          </div>

          <div className="flex gap-2 md:gap-4">
            <a
              href="/reserve"
              className="px-5 md:px-10 py-2.5 border border-gold/30 hover:bg-gold/10 transition-colors text-[10px] md:text-xs tracking-[0.3em] font-bold"
            >
              BOOK
            </a>
            <a
              href="/track"
              className="px-5 md:px-10 py-2.5 border border-gold/30 hover:bg-gold/10 transition-colors text-[10px] md:text-xs tracking-[0.3em] font-bold"
            >
              TRACK
            </a>
          </div>
        </div>

        {/* Link Grid: Centered Spacing */}
        <div className="flex-1 flex flex-col justify-center py-12 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 md:gap-y-0 px-2">
            {footerLinks.map((col) => (
              <div key={col.heading} className="flex flex-col gap-6">
                <h4 className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold/40 font-bold border-l-2 border-gold/10 pl-3">
                  {col.heading}
                </h4>
                <ul className="flex flex-col gap-4 md:gap-6">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm md:text-lg text-gold/80 hover:text-gold transition-all duration-300 uppercase tracking-[0.2em] font-medium hover:pl-2"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Socials Column */}
            <div className="flex flex-col gap-6">
              <h4 className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-gold/40 font-bold border-l-2 border-gold/10 pl-3">
                Follow Us
              </h4>
              <div className="flex gap-6 mt-2">
                <a href="https://instagram.com" className="text-gold/60 hover:text-gold transition-colors hover:scale-110 active:scale-95"><Instagram size={24} /></a>
                <a href="https://facebook.com" className="text-gold/60 hover:text-gold transition-colors hover:scale-110 active:scale-95"><Facebook size={24} /></a>
                <a href="https://twitter.com" className="text-gold/60 hover:text-gold transition-colors hover:scale-110 active:scale-95"><Twitter size={24} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className="pt-12 border-t border-gold/10 text-center flex flex-col md:flex-row justify-between items-center gap-6 mt-auto">
          <div className="text-left hidden md:block">
            <p className="text-[10px] text-gold/20 tracking-[0.4em] uppercase">
              Est. 2024 • SANCTUARY
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] md:text-[13px] uppercase tracking-[0.4em] font-bold text-gold/60">
              Crafted with Soul
            </p>
            <p className="text-[9px] md:text-[11px] text-gold/30 tracking-[0.3em] uppercase">
              © 2024 The House of Earthmonk
            </p>
          </div>

          <div className="text-right flex gap-6">
            <span className="text-[10px] text-gold/20 tracking-[0.3em] uppercase cursor-help hover:text-gold/40 transition-colors">VADODARA</span>
            <span className="text-[10px] text-gold/20 tracking-[0.3em] uppercase cursor-help hover:text-gold/40 transition-colors">ANAND</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
