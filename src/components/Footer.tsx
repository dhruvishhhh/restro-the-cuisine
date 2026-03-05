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
    <footer className="bg-forest-deep text-gold px-6 py-4 md:px-12 md:py-8 font-sans border-t border-gold/10 h-[100dvh] md:h-screen flex flex-col justify-between overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-between">
        {/* Top Bar: Brand & Action Buttons */}
        <div className="flex justify-between items-center pb-4 border-b border-gold/10">
          <div className="flex flex-col">
            <h3 className="text-sm md:text-lg tracking-wider uppercase font-serif font-medium text-gold/90 leading-tight">
              The House of
            </h3>
            <span className="text-[10px] md:text-xs tracking-[0.3em] font-bold text-gold/60 uppercase mt-0.5">
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

        {/* Link Grid: Tightly Centered */}
        <div className="flex-1 flex flex-col justify-center py-2 md:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 md:gap-y-0 px-1">
            {footerLinks.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3 md:gap-4">
                <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold/30 font-bold">
                  {col.heading}
                </h4>
                <ul className="flex flex-col gap-2 md:gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[11px] md:text-sm text-gold/70 hover:text-gold transition-colors duration-300 uppercase tracking-widest font-medium"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Socials Column */}
            <div className="flex flex-col gap-3 md:gap-4">
              <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold/30 font-bold">
                Follow Us
              </h4>
              <div className="flex gap-5 mt-0.5">
                <a href="https://instagram.com" className="text-gold/60 hover:text-gold transition-colors"><Instagram size={18} /></a>
                <a href="https://facebook.com" className="text-gold/60 hover:text-gold transition-colors"><Facebook size={18} /></a>
                <a href="https://twitter.com" className="text-gold/60 hover:text-gold transition-colors"><Twitter size={18} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Branding: Anchored to Very Bottom */}
        <div className="pt-4 border-t border-gold/10 text-center flex flex-col items-center gap-2">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold/50">
              Crafted with Soul
            </p>
            <p className="text-[9px] text-gold/20 tracking-widest uppercase">
              © 2024 The House of Earthmonk
            </p>
          </div>

          <div className="flex gap-4 opacity-30 mt-1 mb-2">
            <span className="text-[8px] tracking-[0.3em] uppercase">VADODARA</span>
            <span className="text-[8px] tracking-[0.3em] uppercase">ANAND</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
