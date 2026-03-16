import { Instagram, Facebook, Twitter, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-timber pt-12 md:pt-24 pb-8 md:pb-12 overflow-hidden" id="contact">
      {/* Decorative Overlays */}
      <div className="absolute inset-0 mesh-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16 mb-12 md:mb-20">
          {/* Brand Column */}
          <div className="flex flex-col gap-4 md:gap-8">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground gold-glow uppercase">
              Restro<br />
              <span className="text-primary italic lowercase">global cuisine</span>
            </h2>
            <p className="text-foreground/50 text-xs md:text-sm leading-relaxed max-w-xs font-sans font-light">
              Crafting conscious culinary experiences where nature meets artisan craft. 
            </p>
            <div className="flex gap-4 md:gap-6 mt-2">
              <a href="https://instagram.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Facebook size={16} />
              </a>
              <a href="https://twitter.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Contact Details - Essential for Mobile */}
          <div className="flex flex-col gap-4 md:gap-8">
            <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Connect</h3>
            <div className="flex flex-col gap-3 md:gap-4">
              <a href="tel:+917600600727" className="flex items-center gap-3 text-xs md:text-sm text-foreground/70 hover:text-primary transition-colors">
                <Phone size={14} className="text-primary/40" />
                +91 76006 00727
              </a>
              <a href="mailto:info@restro.the.cuisine" className="flex items-center gap-3 text-xs md:text-sm text-foreground/70 hover:text-primary transition-colors truncate">
                <Mail size={14} className="text-primary/40" />
                info@restro.the.cuisine
              </a>
              <div className="flex items-start gap-3 text-xs md:text-sm text-foreground/70">
                <MapPin size={14} className="text-primary/40 mt-1 shrink-0" />
                <p className="font-light">Lambhvel Road, Opp. Hero Showroom, Anand</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="hidden md:flex flex-col gap-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Explore</h3>
            <ul className="flex flex-col gap-4">
              {['Home', 'Menu', 'Experience', 'About'].map((link) => (
                <li key={link}>
                  <a href={link === 'Home' ? '/' : `/${link.toLowerCase()}`} className="text-sm text-foreground/70 hover:text-primary transition-all duration-300 hover:pl-2">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin / Portal */}
          <div className="flex flex-col gap-4 md:gap-8 mt-4 md:mt-0">
             <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Portal</h3>
             <a href="/admin/login" className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors group">
                Admin Entry
                <span className="w-6 h-px bg-current opacity-30 group-hover:w-10 transition-all" />
              </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 md:pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-foreground/30 font-light text-center md:text-left">
            © 2024 Restro Global Cuisine. All Rights Reserved.
          </p>
          <div className="flex gap-6 md:gap-8">
            <a href="/privacy" className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-foreground/30 hover:text-primary transition-colors">Privacy</a>
            <a href="/terms" className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-foreground/30 hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
