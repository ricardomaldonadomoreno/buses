import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Compass } from 'lucide-react';
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
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
          0
        </span>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Compass className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/70">{emptyText}</p>
          {isWeMove && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {t('landing.weMove.slogan')}
            </p>
          )}
        </div>

        {isWeMove && (
          <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full max-w-xs">
            <Link
              to="/wemove"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              <Search className="h-3.5 w-3.5" />
              {t('landing.weMove.ctaSearch')}
            </Link>
            <Link
              to="/wemove/register"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t('landing.weMove.ctaJoin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
