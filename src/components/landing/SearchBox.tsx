import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import type { ServiceType } from './ServiceButtons';

interface SearchBoxProps {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  service?: ServiceType;
}

export function SearchBox({ 
  origin, 
  destination, 
  onOriginChange, 
  onDestinationChange,
  service = 'packservice'
}: SearchBoxProps) {
  const { t } = useTranslation();

  const originPlaceholder = service === 'wemove' 
    ? t('landing.weMove.origin') 
    : t('landing.origin');
  
  const destinationPlaceholder = service === 'wemove' 
    ? t('landing.weMove.destination') 
    : t('landing.destination');

  return (
    <div className="border-4 border-foreground bg-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
        <Input
          placeholder={originPlaceholder}
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          className="border-2 border-foreground"
        />
      </div>
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-destructive flex-shrink-0" />
        <Input
          placeholder={destinationPlaceholder}
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="border-2 border-foreground"
        />
      </div>
    </div>
  );
}
