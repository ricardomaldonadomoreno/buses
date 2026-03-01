// src/components/wemove/WeMoveHeroSearch.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LocationSearch } from './LocationSearch';
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, UserPlus, ShieldCheck, Star, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location { id: string; name: string; state_name: string | null; country_code: string | null; display_name: string | null; verified: boolean; }
interface WeMoveHeroSearchProps { onSearch: (origin: string, destination: string, date?: Date) => void; }

export function WeMoveHeroSearch({ onSearch }: WeMoveHeroSearchProps) {
  const { t, i18n } = useTranslation();
  const [origin, setOrigin]           = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [date, setDate]               = useState<Date | undefined>();
  const [calOpen, setCalOpen]         = useState(false);

  // Locale del calendario según idioma activo
  const calLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'en' ? enUS : es;

  const handleSearch = () => {
    if (!origin || !destination) return;
    onSearch(origin.id, destination.id, date);
  };

  return (
    <section className="relative bg-primary overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: `radial-gradient(circle, hsl(var(--primary-foreground)) 1.5px, transparent 1.5px)`, backgroundSize: '28px 28px' }} />
      <div className="absolute top-0 right-0 w-2/5 h-full bg-primary-foreground/5 pointer-events-none"
        style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)' }} />

      <div className="relative container py-12 md:py-16">
        <div className="max-w-2xl">

          {/* Tag */}
          <div className="inline-flex items-center gap-2 border-2 border-primary-foreground/30 px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-primary-foreground/90 text-xs font-bold uppercase tracking-widest">
              {t('weMove.hero.tag')}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black text-primary-foreground leading-none tracking-tight mb-2">
            WeMove
          </h1>
          <p className="text-primary-foreground font-bold text-lg md:text-xl mb-1">
            {t('weMove.subtitle')}
          </p>
          <p className="text-primary-foreground/80 text-sm mb-8 max-w-md font-medium">
            {t('weMove.description')}
          </p>

          {/* ── SEARCH BOX ── */}
          <div className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="bg-foreground px-5 py-2.5 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-background" />
              <span className="text-background text-xs font-black uppercase tracking-widest">
                {t('weMove.hero.searchLabel')}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LocationSearch
                  label={t('weMove.hero.from')}
                  placeholder={t('weMove.hero.selectOrigin')}
                  value={origin}
                  onChange={setOrigin}
                  excludeId={destination?.id}
                  pinColor="primary"
                />
                <LocationSearch
                  label={t('weMove.hero.to')}
                  placeholder={t('weMove.hero.selectDestination')}
                  value={destination}
                  onChange={setDestination}
                  excludeId={origin?.id}
                  pinColor="destructive"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
                    {t('weMove.hero.when')}
                  </label>
                  <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline"
                        className={cn('w-full h-12 border-2 border-foreground justify-start text-left font-semibold rounded-none',
                          !date && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {date ? format(date, 'd MMM', { locale: calLocale }) : t('weMove.hero.anyDay')}
                        {date && (
                          <button type="button" onClick={e => { e.stopPropagation(); setDate(undefined); }}
                            className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date}
                        onSelect={d => { setDate(d); setCalOpen(false); }}
                        disabled={d => d < new Date(new Date().setHours(0,0,0,0))}
                        locale={calLocale} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search button */}
                <div className="flex flex-col justify-end">
                  <button type="button" onClick={handleSearch}
                    disabled={!origin || !destination}
                    className="w-full h-12 bg-foreground text-background font-black text-sm uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <Search className="h-4 w-4" />
                    {t('weMove.searchTransport')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
            {([
              { icon: ShieldCheck, key: 'weMove.hero.trust1' },
              { icon: Star,        key: 'weMove.hero.trust2' },
              { icon: Users,       key: 'weMove.hero.trust3' },
            ] as const).map(({ icon: Icon, key }) => (
              <span key={key} className="flex items-center gap-1.5 text-primary-foreground/90 text-xs font-semibold">
                <Icon className="h-3.5 w-3.5" /> {t(key)}
              </span>
            ))}
          </div>

          {/* CTA Transportador */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-8 border-t-2 border-primary-foreground/20">
            <div>
              <p className="text-primary-foreground font-black text-base">
                {t('weMove.hero.transporterCta')}
              </p>
            </div>
            <Link to="/wemove/register"
              className="shrink-0 inline-flex items-center gap-2 bg-primary-foreground text-primary font-black text-sm px-5 py-3 border-2 border-primary-foreground hover:bg-primary-foreground/90 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
              <UserPlus className="h-4 w-4" />
              {t('weMove.hero.registerFree')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
