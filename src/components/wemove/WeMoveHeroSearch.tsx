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
  Users, ShieldCheck, Star, ArrowRight
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* ── IZQUIERDA: identidad ── */}
          <div>
            {/* Tag */}
            <div className="inline-flex items-center gap-2 border-2 border-primary-foreground/40 px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-primary-foreground text-xs font-bold uppercase tracking-widest">
                {t('weMove.hero.tag')}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-7xl md:text-8xl font-black text-primary-foreground leading-none tracking-tight mb-3">
              WeMove
            </h1>

            {/* Subtítulo */}
            <p className="text-primary-foreground text-xl md:text-2xl font-bold mb-4">
              {t('weMove.subtitle')}
            </p>

            {/* Descripción — opacidad alta para legibilidad */}
            <p className="text-primary-foreground/80 text-base leading-relaxed mb-8 max-w-md">
              {t('weMove.description')}
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5">
              {[
                { icon: ShieldCheck, label: t('weMove.hero.trust1') },
                { icon: Star,        label: t('weMove.hero.trust2') },
                { icon: Users,       label: t('weMove.hero.trust3') },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-primary-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── DERECHA: search box ── */}
          <div className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            {/* Header del box */}
            <div className="bg-foreground px-5 py-2.5 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-background" />
              <span className="text-background text-xs font-black uppercase tracking-widest">
                {t('weMove.hero.searchLabel')}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Origin */}
              <div>
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
              <div>
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
                      {date ? format(date, 'PP', { locale: es }) : t('weMove.hero.anyDay')}
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
              <Button
                size="lg"
                onClick={handleSearch}
                className="w-full h-12 border-2 border-foreground font-black text-sm gap-2 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
              >
                <Search className="h-4 w-4" />
                {t('weMove.searchTransport')}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Transporter CTA bar */}
      <div className="relative border-t-2 border-primary-foreground/20 bg-primary-foreground/5">
        <div className="container py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-primary-foreground/80 text-sm font-medium text-center sm:text-left">
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
