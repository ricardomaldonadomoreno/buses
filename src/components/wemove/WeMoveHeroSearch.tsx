import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLocations } from '@/hooks/useWeMoveData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarIcon, MapPin, Search, UserPlus,
  Users, ShieldCheck, Star, ArrowRight, ChevronDown, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Combobox con búsqueda por texto ──────────────────────────────────────────
interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  excludeId?: string;
  pinColor?: string;
  disabled?: boolean;
}

function CityCombobox({ value, onChange, placeholder, excludeId, pinColor = 'text-primary', disabled }: CityComboboxProps) {
  const { data: locations, isLoading } = useLocations();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = locations?.find(l => l.id === value);

  const filtered = (locations ?? [])
    .filter(l => l.id !== excludeId)
    .filter(l => l.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button — mismo aspecto que el SelectTrigger original */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'w-full h-12 flex items-center gap-0 border-2 border-foreground bg-background pl-9 pr-3',
          'font-semibold text-sm text-left transition-colors',
          'hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'ring-2 ring-foreground ring-offset-0'
        )}
      >
        <MapPin className={cn('absolute left-3 h-4 w-4 shrink-0', pinColor)} />
        <span className={cn('flex-1 truncate', !selected && 'text-muted-foreground font-normal')}>
          {selected?.name ?? placeholder}
        </span>
        {value && !disabled ? (
          <X
            className="h-4 w-4 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150', open && 'rotate-180')} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-background border-2 border-t-0 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
          {/* Filter input */}
          <div className="flex items-center gap-2 border-b-2 border-foreground px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Escribe para filtrar..."
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          {/* City list */}
          <ul className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Cargando ciudades...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
            ) : (
              filtered.map(loc => (
                <li
                  key={loc.id}
                  onClick={() => handleSelect(loc.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-secondary',
                    loc.id === value && 'bg-primary text-primary-foreground font-bold hover:bg-primary/90'
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  {loc.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── WeMoveHeroSearch ──────────────────────────────────────────────────────────
interface WeMoveHeroSearchProps {
  onSearch: (origin: string, destination: string, date?: Date) => void;
}

export function WeMoveHeroSearch({ onSearch }: WeMoveHeroSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading: locLoading } = useLocations();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date | undefined>();

  const handleSearch = () => {
    onSearch(origin, destination, date);
  };

  return (
    <section className="relative bg-primary overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary-foreground)) 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Bold diagonal stripe */}
      <div
        className="absolute top-0 right-0 w-2/5 h-full bg-primary-foreground/5 pointer-events-none"
        style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      />

      <div className="relative container py-12 md:py-16">
        <div className="max-w-2xl">

          {/* Identity tag */}
          <div className="inline-flex items-center gap-2 border-2 border-primary-foreground/30 px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-primary-foreground/80 text-xs font-bold uppercase tracking-widest">
              {t('weMove.hero.tag')}
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-black text-primary-foreground leading-none tracking-tight mb-2">
            WeMove
          </h1>
          <p className="text-primary-foreground/70 text-lg md:text-xl font-semibold mb-1">
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
                <CityCombobox
                  value={origin}
                  onChange={setOrigin}
                  placeholder={t('weMove.hero.selectOrigin')}
                  pinColor="text-primary"
                  disabled={locLoading}
                />
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
                  {t('weMove.hero.to')}
                </label>
                <CityCombobox
                  value={destination}
                  onChange={setDestination}
                  placeholder={t('weMove.hero.selectDestination')}
                  excludeId={origin}
                  pinColor="text-destructive"
                  disabled={locLoading}
                />
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
