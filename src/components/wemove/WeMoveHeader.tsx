import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';

export function WeMoveHeader() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-primary/95 backdrop-blur-sm border-b-4 border-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/wemove" className="font-black text-2xl text-foreground tracking-tight">
          {t('weMove.title')}{' '}
          <span className="text-lg font-bold opacity-70">{t('weMove.byBusesApp')}</span>
        </Link>

        <nav className="flex items-center gap-3">
          <LanguageSelector />

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="border-2 border-foreground/40 text-foreground hover:bg-foreground/10 h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Link
            to="/auth"
            className="font-bold text-foreground hover:underline underline-offset-4 text-sm"
          >
            {t('common.access')}
          </Link>
          <Link
            to="/"
            className="font-bold text-foreground hover:underline underline-offset-4 text-sm"
          >
            {t('common.backToHome')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
