import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';

export function WeMoveHeader() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background border-b-4 border-foreground">
      <div className="container flex h-16 items-center justify-between">

        {/* Logo + nombre */}
        <Link to="/wemove" className="flex items-center gap-2">
          <img src="/logo.png" alt="WeMove" className="h-8 w-auto" />
          <span className="font-black text-xl text-foreground tracking-tight">
            {t('weMove.title')}
            <span className="text-sm font-bold text-muted-foreground ml-1">{t('weMove.byBusesApp')}</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <LanguageSelector />

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="border-2 border-foreground/40 text-foreground hover:bg-foreground/10 h-9 w-9 rounded-full"
          >
            {resolvedTheme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            }
          </Button>

          <Button asChild size="sm" variant="outline"
            className="rounded-full border-2 border-foreground font-bold text-foreground hover:bg-foreground/10"
          >
            <Link to="/auth">{t('common.access')}</Link>
          </Button>

          <Button asChild size="sm" variant="outline"
            className="rounded-full border-2 border-foreground font-bold text-foreground hover:bg-foreground/10"
          >
            <Link to="/">← {t('common.backToHome')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
