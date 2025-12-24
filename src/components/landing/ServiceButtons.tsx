import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ServiceButtons() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        asChild
        size="lg"
        className="h-auto py-4 flex-col gap-1 border-4 border-foreground bg-primary hover:bg-primary/90"
      >
        <Link to="/packservice">
          <Package className="h-6 w-6" />
          <span className="font-bold">{t('landing.packService.title')}</span>
          <span className="text-sm opacity-90">{t('landing.packService.subtitle')}</span>
        </Link>
      </Button>
      
      <Button
        asChild
        size="lg"
        className="h-auto py-4 flex-col gap-1 border-4 border-foreground bg-secondary text-secondary-foreground hover:bg-secondary/90"
      >
        <Link to="/wemove">
          <Users className="h-6 w-6" />
          <span className="font-bold">{t('landing.weMove.title')}</span>
          <span className="text-sm opacity-90">{t('landing.weMove.subtitle')}</span>
        </Link>
      </Button>
    </div>
  );
}