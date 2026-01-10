import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceType } from './ServiceButtons';

interface ResultsPlaceholderProps {
  service?: ServiceType;
}

export function ResultsPlaceholder({ service = 'packservice' }: ResultsPlaceholderProps) {
  const { t } = useTranslation();

  const isWeMove = service === 'wemove';
  const title = isWeMove ? t('landing.weMove.resultsTitle') : t('landing.results');
  const emptyText = isWeMove ? t('landing.weMove.noResultsYet') : t('landing.noResultsYet');

  return (
    <div className="border-4 border-foreground bg-card p-6 min-h-[200px] flex flex-col">
      <h3 className="font-bold text-lg border-b-2 border-foreground pb-2 mb-4">
        {title}
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
        <Search className="h-12 w-12 mb-3 opacity-50" />
        <p className="mb-4">{emptyText}</p>
        
        {isWeMove && (
          <>
            <p className="text-sm font-medium text-foreground mb-4">
              {t('landing.weMove.slogan')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="default">
                <Link to="/wemove">
                  <Search className="h-4 w-4 mr-2" />
                  {t('landing.weMove.ctaSearch')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/wemove/registro-transportador">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('landing.weMove.ctaJoin')}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
