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
      {/* Gold top line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container flex h-16 items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to="/wemove"
          className="flex items-center gap-3 shrink-0 group"
          aria-label="WeMove"
        >
          <img
            src="/logo.png"
            alt="BusesApp"
            className="h-9 w-auto object-contain transition-opacity group-hover:opacity-80"
            loading="eager"
          />
          <div className="hidden sm:block leading-none">
            <span className="font-serif text-xl font-semibold text-foreground tracking-wide">
              We<span className="text-primary">Move</span>
            </span>
            <p className="text-[10px] text-muted-foreground font-sans tracking-widest uppercase mt-0.5">
              by BusesApp
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <LanguageSelector />

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="font-medium text-foreground hover:text-primary"
          >
            <Link to="/">
              {t('common.backToHome')}
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Link to="/auth">
              <UserCircle className="h-4 w-4" />
              {t('common.access')}
            </Link>
          </Button>
        </nav>

        {/* Mobile: lang + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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

      {/* Mobile dropdown menu */}
      <div
        className={cn(
          'md:hidden border-t border-border/60 bg-background overflow-hidden transition-all duration-300 ease-in-out',
          mobileOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-2">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px] flex items-center"
          >
            {t('common.backToHome')}
          </Link>
          <Link
            to="/auth"
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 rounded-xl text-sm font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <UserCircle className="h-4 w-4" />
            {t('common.access')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
