import { Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-timber pt-24 pb-12 overflow-hidden" id="contact">
      {/* Decorative Overlays */}
      <div className="absolute inset-0 mesh-pattern opacity-10 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="flex flex-col gap-8">
            <h2 className="font-serif text-3xl text-foreground gold-glow">
              Restro<br />
              <span className="text-primary italic">Global Cuisine</span>
            </h2>
            <p className="text-foreground/50 text-sm leading-relaxed max-w-xs font-sans font-light">
              Crafting conscious culinary experiences where nature meets artisan craft. 
              Join us for a journey of mindful dining.
            </p>
            <div className="flex gap-6">
              <a href="https://instagram.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" className="text-primary/60 hover:text-primary transition-colors duration-300">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Navigation</h3>
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

          {/* Locations */}
          <div className="flex flex-col gap-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Locations</h3>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-foreground/80 mb-1">Downtown Bistro</p>
                <p className="text-xs text-foreground/40 font-light font-sans uppercase tracking-tighter">123 Culinary Ave, Suite 100</p>
              </div>
              <div>
                <p className="text-sm text-foreground/80 mb-1">Coastal Lounge</p>
                <p className="text-xs text-foreground/40 font-light font-sans uppercase tracking-tighter">456 Shoreline Dr, Oasis Bay</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/40">Connect</h3>
            <div className="flex flex-col gap-4">
              <a href="mailto:hello@restro-cuisine.com" className="text-sm text-foreground/70 hover:text-primary transition-colors line-clamp-1">
                hello@restro-cuisine.com
              </a>
              <p className="text-sm text-foreground/70">+1 (555) 000-RESR</p>
              <a href="/admin/login" className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors group">
                Admin Portal
                <span className="w-4 h-px bg-current opacity-30 group-hover:w-8 transition-all" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 font-light">
            © 2024 Restro Global Cuisine. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="/privacy" className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 hover:text-primary transition-colors">Privacy</a>
            <a href="/terms" className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
