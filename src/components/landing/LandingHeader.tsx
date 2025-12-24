import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';

export function LandingHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full bg-yellow-400 border-b-4 border-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-black text-2xl text-foreground tracking-tight">
          {t('common.appName')}
        </Link>

        <nav className="flex items-center gap-4">
          <LanguageSelector />
          <Link 
            to="/auth" 
            className="font-bold text-foreground hover:underline underline-offset-4"
          >
            {t('common.access')}
          </Link>
          <Link 
            to="/contact" 
            className="font-bold text-foreground hover:underline underline-offset-4"
          >
            {t('common.contact')}
          </Link>
        </nav>
      </div>
    </header>
  );
}