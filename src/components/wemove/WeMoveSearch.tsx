import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLocations } from '@/hooks/useWeMoveData';

interface WeMoveSearchProps {
  onSearch: (origin: string, destination: string, date?: Date) => void;
}

export function WeMoveSearch({ onSearch }: WeMoveSearchProps) {
  const { t } = useTranslation();
  const { data: locations, isLoading } = useLocations();
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<Date>();

  const handleSearch = () => {
    onSearch(origin, destination, date);
  };

  return (
    <section id="search-section" className="py-12 bg-muted/50">
      <div className="container max-w-4xl">
        <h2 className="text-3xl font-black text-center mb-8 text-foreground">
          {t('weMove.searchTitle')}
        </h2>
        
        <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0px_0px_hsl(var(--foreground))]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={origin} onValueChange={setOrigin} disabled={isLoading}>
              <SelectTrigger className="border-2 border-foreground h-12">
                <SelectValue placeholder={t('landing.origin')} />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={destination} onValueChange={setDestination} disabled={isLoading}>
              <SelectTrigger className="border-2 border-foreground h-12">
                <SelectValue placeholder={t('landing.destination')} />
              </SelectTrigger>
              <SelectContent>
                {locations?.filter(loc => loc.id !== origin).map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 border-2 border-foreground justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{t('trips.date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button 
              onClick={handleSearch}
              className="h-12 gap-2 border-4 border-foreground font-bold"
            >
              <Search className="h-5 w-5" />
              {t('common.search')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
