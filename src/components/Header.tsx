import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Bus, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary">
            <Bus className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">{t('common.appName')}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/trips" className="font-medium hover:underline underline-offset-4">
            {t('trips.title')}
          </Link>
          <Link to="/transactions" className="font-medium hover:underline underline-offset-4">
            {t('transactions.title')}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector />
          <Button variant="outline" className="border-2" asChild>
            <Link to="/auth">{t('common.login')}</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?mode=signup">{t('common.signup')}</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <Button
            variant="outline"
            size="icon"
            className="border-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-foreground bg-background">
          <nav className="container flex flex-col gap-4 py-4">
            <Link
              to="/trips"
              className="font-medium py-2 hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('trips.title')}
            </Link>
            <Link
              to="/transactions"
              className="font-medium py-2 hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('transactions.title')}
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-2" asChild>
                <Link to="/auth">{t('common.login')}</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/auth?mode=signup">{t('common.signup')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
