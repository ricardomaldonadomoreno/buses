import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLocations } from '@/hooks/useWeMoveData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarIcon, MapPin, Search, UserPlus,
  Users, ShieldCheck, Star, ArrowRight,
  TrendingUp, Route, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeMoveHeroSearchProps {
  onSearch: (origin: string, destination: string, date?: Date) => void;
}

export function WeMoveHeroSearch({ onSearch }: WeMoveHeroSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: locations, isLoading: locLoading } = useLocations();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date | undefined>();

  const handleSearch = () => onSearch(origin, destination, date);

  const stats = [
    { icon: Users,      value: '2.4k+', label: t('weMove.hero.statPassengers') },
    { icon: Route,      value: '180+',  label: t('weMove.hero.statRoutes') },
    { icon: TrendingUp, value: '98%',   label: t('weMove.hero.statSatisfaction') },
    { icon: Clock,      value: '24/7',  label: t('weMove.hero.statSupport') },
  ];

  return (
    <section className="relative bg-primary overflow-hidden pt-16">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary-foreground)) 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative container py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── LEFT: texto + search box ── */}
          <div>
            {/* Identity tag */}
            <div className="inline-flex items-center gap-2 border-2 border-primary-foreground/30 px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-primary-foreground/80 text-xs font-bold uppercase tracking-widest">
                {t('weMove.hero.tag')}
              </span>
            </div>

            {/* Main title */}
            <h1 className="text-6xl md:text-7xl font-black text-primary-foreground leading-none tracking-tight mb-2">
              WeMove
            </h1>
            <p className="text-primary-foreground/70 text-lg font-semibold mb-1">
              {t('weMove.subtitle')}
            </p>
            <p className="text-primary-foreground/50 text-sm mb-8 max-w-md">
              {t('weMove.description')}
            </p>

            {/* ── SEARCH BOX ── */}
            <div className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
              {/* Search header */}
              <div className="bg-foreground px-5 py-2.5 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-background" />
                <span className="text-background text-xs font-black uppercase tracking-widest">
                  {t('weMove.hero.searchLabel')}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Origin */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
                    {t('weMove.hero.from')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10 pointer-events-none" />
                    <Select value={origin} onValueChange={setOrigin} disabled={locLoading}>
                      <SelectTrigger className="border-2 border-foreground h-12 pl-9 font-semibold">
                        <SelectValue placeholder={t('weMove.hero.selectOrigin')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Destination */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
                    {t('weMove.hero.to')}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive z-10 pointer-events-none" />
                    <Select value={destination} onValueChange={setDestination} disabled={locLoading}>
                      <SelectTrigger className="border-2 border-foreground h-12 pl-9 font-semibold">
                        <SelectValue placeholder={t('weMove.hero.selectDestination')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.filter(l => l.id !== origin).map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
                    {t('weMove.hero.when')}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full h-12 border-2 border-foreground justify-start text-left font-semibold',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {date
                          ? format(date, 'PP', { locale: es })
                          : t('weMove.hero.anyDay')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-2 border-foreground" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search Button */}
                <div className="flex flex-col justify-end">
                  <div className="h-5" />
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="h-12 border-2 border-foreground font-black text-sm gap-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                  >
                    <Search className="h-4 w-4" />
                    {t('weMove.searchTransport')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              {[
                { icon: ShieldCheck, label: t('weMove.hero.trust1') },
                { icon: Star,        label: t('weMove.hero.trust2') },
                { icon: Users,       label: t('weMove.hero.trust3') },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-primary-foreground/60">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: stats decorativos ── */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* Stats grid 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div
                  key={i}
                  className="bg-primary-foreground/10 border-2 border-primary-foreground/20 p-5 flex flex-col gap-2 hover:bg-primary-foreground/15 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary-foreground/60" />
                  <span className="text-4xl font-black text-primary-foreground leading-none">{value}</span>
                  <span className="text-xs font-bold text-primary-foreground/50 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>

            {/* Tagline decorativa */}
            <div className="border-2 border-primary-foreground/20 bg-primary-foreground/5 px-5 py-4">
              <p className="text-primary-foreground/80 text-sm font-bold italic leading-relaxed">
                "{t('weMove.hero.quote')}"
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Transporter CTA bar */}
      <div className="relative border-t-2 border-primary-foreground/20 bg-primary-foreground/5">
        <div className="container py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-primary-foreground/70 text-sm font-medium text-center sm:text-left">
            {t('weMove.hero.transporterCta')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wemove/register')}
            className="border-2 border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 gap-2 font-bold shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            {t('weMove.becomeTransporter')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-1 bg-foreground" />
    </section>
  );
}
