import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Menu, X, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function WeMoveHeader() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md">
      {/* ── Thin gold line on top ── */}
      <div className="h-0.5 w-full bg-gold-gradient" />

      <div className="container flex h-16 items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link
          to="/wemove"
          className="flex items-center gap-3 shrink-0 group no-tap-highlight"
          aria-label="WeMove"
        >
          <img
            src="/logo.png"
            alt="BusesApp logo"
            className="h-9 w-auto object-contain transition-opacity group-hover:opacity-80"
            loading="eager"
          />
          <div className="hidden sm:block leading-none">
            <span className="font-display text-xl font-semibold text-foreground tracking-wide">
              We<span className="text-gold-500">Move</span>
            </span>
            <p className="text-[10px] text-muted-foreground font-sans tracking-luxury uppercase">
              by BusesApp
            </p>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-2">
          <LanguageSelector />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="font-medium text-foreground hover:text-primary hover:bg-primary/8"
          >
            <Link to="/">
              {t('common.backToHome')}
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="btn-gold font-semibold gap-2"
          >
            <Link to="/auth">
              <UserCircle className="h-4 w-4" />
              {t('common.access')}
            </Link>
          </Button>
        </nav>

        {/* ── Mobile: lang selector + hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors no-tap-highlight"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X className="h-5 w-5" />
              : <Menu className="h-5 w-5" />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={cn(
          'md:hidden border-t border-border/60 bg-background/98 backdrop-blur-md',
          'overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-2">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {t('common.backToHome')}
          </Link>
          <Link
            to="/auth"
            onClick={() => setMobileOpen(false)}
            className="btn-gold text-center px-4 py-3 rounded-xl text-sm font-semibold"
          >
            {t('common.access')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
