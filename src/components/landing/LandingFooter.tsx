import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Package, Users, Mail, Phone, MapPin, Shield } from 'lucide-react';

export function LandingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card">
      <div className="container py-12">

        {/* Top section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <img
                src="/logo.png"
                alt="BUSES"
                className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
              />
              <span className="font-serif text-xl font-bold text-foreground">BUSES</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Conectamos personas, empresas y logística en un solo lugar.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Propiedad intelectual registrada SENAPI</span>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Servicios</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/packservice" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group">
                  <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                  PackService
                  <span className="text-xs text-muted-foreground">· Paquetería</span>
                </Link>
              </li>
              <li>
                <Link to="/wemove" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                  WeMove
                  <span className="text-xs text-muted-foreground">· Pasajeros</span>
                </Link>
              </li>
              <li className="text-sm text-muted-foreground/60 flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border border-border/60 shrink-0 flex items-center justify-center text-[8px]">+</span>
                Más módulos próximamente
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/terms" className="text-foreground/70 hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" className="text-foreground/70 hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/cookies" className="text-foreground/70 hover:text-primary transition-colors">{t('footer.cookies')}</Link></li>
              <li><Link to="/about" className="text-foreground/70 hover:text-primary transition-colors">{t('footer.about')}</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('common.contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <Mail className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <a href="mailto:buses.app@gmail.com" className="hover:text-primary transition-colors break-all">
                  buses.app@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <Phone className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>Not Phone</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/70">
                <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>Emiratos Arabes Unidos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} BUSES. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary" />
            Propiedad Intelectual
          </span>
        </div>
      </div>
    </footer>
  );
}
