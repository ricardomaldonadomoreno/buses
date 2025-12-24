import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t-4 border-foreground bg-card">
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
          <Link to="/terms" className="hover:underline underline-offset-4">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className="hover:underline underline-offset-4">
            {t('footer.privacy')}
          </Link>
          <Link to="/cookies" className="hover:underline underline-offset-4">
            {t('footer.cookies')}
          </Link>
          <Link to="/about" className="hover:underline underline-offset-4">
            {t('footer.about')}
          </Link>
          <Link to="/contact" className="hover:underline underline-offset-4">
            {t('footer.contact')}
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t-2 border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('common.appName')}. {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}