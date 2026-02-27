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
  service = 'packservice',
}: SearchBoxProps) {
  const { t } = useTranslation();

  const originPlaceholder =
    service === 'wemove' ? t('landing.weMove.origin') : t('landing.origin');
  const destinationPlaceholder =
    service === 'wemove' ? t('landing.weMove.destination') : t('landing.destination');

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
      {/* Origin */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
        <Input
          placeholder={originPlaceholder}
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 h-auto p-0"
        />
      </div>

      {/* Divider dot */}
      <div className="relative px-4">
        <div className="absolute left-[1.35rem] top-1/2 -translate-y-1/2 h-2 w-px bg-primary/40" />
      </div>

      {/* Destination */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <MapPin className="h-4 w-4 text-destructive/70 flex-shrink-0" />
        <Input
          placeholder={destinationPlaceholder}
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm font-medium placeholder:text-muted-foreground/60 h-auto p-0"
        />
      </div>
    </div>
  );
}
