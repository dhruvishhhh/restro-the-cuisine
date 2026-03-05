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
    <footer className="bg-forest-deep px-6 py-6 md:px-12 md:py-20" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 md:gap-12 mb-6 md:mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 border-b border-primary-foreground/5 pb-6 md:pb-0 md:border-0">
            <h3 className="font-serif text-xl md:text-2xl text-gold gold-glow mb-2 md:mb-4">
              The House of Earthmonk
            </h3>
            <p className="text-primary-foreground/40 font-sans text-[13px] md:text-sm leading-relaxed mb-4 md:mb-0">
              Rooted in Earth. Crafted with Soul.
            </p>
            <div className="flex gap-4 mt-3 md:mt-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/30 hover:text-gold transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/30 hover:text-gold transition-colors" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/30 hover:text-gold transition-colors" aria-label="Twitter">
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[10px] uppercase tracking-[0.25em] font-sans font-medium text-gold/40 mb-3 md:mb-6">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2 md:gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/50 hover:text-gold font-sans text-xs md:text-sm transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/20 font-sans text-[10px]">
            © 2024 The House of Earthmonk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
