import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/50">
      {/* Gold accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container flex h-16 items-center justify-between gap-4">

        {/* Logo + brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/logo.png"
            alt="Buses.app"
            className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
            loading="eager"
          />
          <div className="hidden sm:block leading-none">
            <span className="font-serif text-xl font-semibold text-foreground">
              buses<span className="text-primary">.app</span>
            </span>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">
              {t('common.tagline')}
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <LanguageSelector />
          <Link
            to="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('common.contact')}
          </Link>
          <Link
            to="/auth"
            className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm min-h-[40px] flex items-center"
          >
            {t('common.access')}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <LanguageSelector />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'md:hidden overflow-hidden transition-all duration-300 border-t border-border/50 bg-background',
        open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <nav className="container py-4 flex flex-col gap-2">
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            {t('common.contact')}
          </Link>
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-sm font-semibold text-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('common.access')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
