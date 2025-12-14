import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bus } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t-2 border-foreground bg-secondary">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <span>{t('common.appName')}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('common.tagline')}
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">{t('roles.sender')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/trips" className="hover:underline">{t('trips.title')}</Link></li>
              <li><Link to="/transactions" className="hover:underline">{t('transactions.create')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">{t('roles.transporter')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/trips/create" className="hover:underline">{t('trips.create')}</Link></li>
              <li><Link to="/dashboard" className="hover:underline">{t('common.dashboard')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">{t('roles.receiver')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/transactions" className="hover:underline">{t('transactions.title')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('common.appName')}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
