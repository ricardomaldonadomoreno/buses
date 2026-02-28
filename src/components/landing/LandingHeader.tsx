import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Sync with system preference on mount
  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/50">
      {/* Gold accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container flex h-16 items-center justify-between gap-4">

        {/* Logo + brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/logo.png"
            alt="BUSES"
            className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
            loading="eager"
          />
          <div className="leading-none">
            <span className="font-serif text-xl font-bold text-foreground tracking-wide">
              BUSES
            </span>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5 hidden sm:block">
              Transporte · Logística · Conexión
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3">
          <LanguageSelector />

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            {isDark
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            }
          </button>

          <Link
            to="/auth"
            className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm min-h-[40px] flex items-center"
          >
            {t('common.access')}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
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
        open ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <nav className="container py-3">
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('common.access')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
