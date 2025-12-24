import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

export function ResultsPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="border-4 border-foreground bg-card p-6 min-h-[200px] flex flex-col">
      <h3 className="font-bold text-lg border-b-2 border-foreground pb-2 mb-4">
        {t('landing.results')}
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <Search className="h-12 w-12 mb-3 opacity-50" />
        <p>{t('landing.noResultsYet')}</p>
      </div>
    </div>
  );
}