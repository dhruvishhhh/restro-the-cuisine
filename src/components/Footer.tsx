import { Instagram, Facebook, Twitter } from "lucide-react";

const footerLinks = [
  {
    heading: "Visit",
    links: ["Menu", "Locations", "Book A Table", "Events"],
  },
  {
    heading: "Company",
    links: ["About", "Awards", "Press", "Franchise", "Careers"],
  },
  {
    heading: "Connect",
    links: ["Contact", "Blog", "Newsletter"],
  },
];

const Footer = () => {
  return (
    <footer className="bg-forest-deep px-6 py-16 md:px-12 md:py-20" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl text-gold gold-glow mb-4">
              House of
              <br />
              Earth Monk
            </h3>
            <p className="text-primary-foreground/40 font-sans text-sm leading-relaxed">
              Rooted in Earth.
              <br />
              Crafted with Soul.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-primary-foreground/40 hover:text-gold transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-primary-foreground/40 hover:text-gold transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-primary-foreground/40 hover:text-gold transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs uppercase tracking-[0.25em] font-sans font-medium text-gold/60 mb-6">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-primary-foreground/50 hover:text-gold font-sans text-sm transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/30 font-sans text-xs">
            © 2024 House of Earth Monk. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-primary-foreground/30 hover:text-gold font-sans text-xs transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-foreground/30 hover:text-gold font-sans text-xs transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
