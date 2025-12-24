import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface SearchBoxProps {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
}

export function SearchBox({ origin, destination, onOriginChange, onDestinationChange }: SearchBoxProps) {
  const { t } = useTranslation();

  return (
    <div className="border-4 border-foreground bg-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <Input
          placeholder={t('landing.origin')}
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          className="border-2 border-foreground"
        />
      </div>
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-destructive flex-shrink-0" />
        <Input
          placeholder={t('landing.destination')}
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="border-2 border-foreground"
        />
      </div>
    </div>
  );
}