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
  Users, ShieldCheck, Star, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Combobox con filtro de texto ─────────────────────────────────────────────
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

  // Solo muestra resultados cuando hay texto escrito
  const filtered = query.trim().length > 0
    ? (locations ?? [])
        .filter(l => l.id !== excludeId)
        .filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
    : [];

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

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <MapPin className={cn('absolute left-4 h-4 w-4 shrink-0 pointer-events-none', pinColor)} />
        <input
          ref={inputRef}
          type="text"
          value={selected && !open ? selected.name : query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-12 pl-10 pr-10 bg-transparent text-sm font-medium outline-none',
            'text-foreground placeholder:text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown — solo cuando hay texto escrito */}
      {open && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Sin resultados</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map(loc => (
                <li
                  key={loc.id}
                  onMouseDown={() => handleSelect(loc.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-muted',
                    loc.id === value && 'font-semibold'
                  )}
                >
                  <MapPin className={cn('h-3.5 w-3.5 shrink-0', pinColor)} />
                  {loc.name}
                </li>
              ))}
            </ul>
          )}
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
      {/* Dot grid background — sin cambios */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary-foreground)) 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px',
        }}
      />
      {/* Bold diagonal stripe — sin cambios */}
      <div
        className="absolute top-0 right-0 w-2/5 h-full bg-primary-foreground/5 pointer-events-none"
        style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      />

      {/* CAMBIO 5: agregado max-w-5xl mx-auto para centrar */}
      <div className="relative container pt-16 pb-12 md:pt-20 md:pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Columna izquierda: texto */}
            <div>
              {/* Identity tag */}
              <div className="inline-flex items-center gap-2 border-2 border-primary-foreground/30 px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {/* CAMBIO 1: quitada opacidad /80 */}
                <span className="text-primary-foreground text-xs font-bold uppercase tracking-widest">
                  {t('weMove.hero.tag')}
                </span>
              </div>

              {/* Main title */}
              <h1 className="text-6xl md:text-8xl font-black text-primary-foreground leading-none tracking-tight mb-2">
                WeMove
              </h1>
              {/* CAMBIO 2: quitada opacidad /70, font-semibold → font-bold */}
              <p className="text-primary-foreground text-lg md:text-xl font-bold mb-1">
                {t('weMove.subtitle')}
              </p>
              {/* CAMBIO 3: quitada opacidad /50, agregado font-semibold */}
              <p className="text-primary-foreground font-semibold text-sm mb-8 max-w-md">
                {t('weMove.description')}
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { icon: ShieldCheck, label: t('weMove.hero.trust1') },
                  { icon: Star,        label: t('weMove.hero.trust2') },
                  { icon: Users,       label: t('weMove.hero.trust3') },
                ].map(({ icon: Icon, label }, i) => (
                  // CAMBIO 4: quitada opacidad /60, font-semibold → font-bold
                  <div key={i} className="flex items-center gap-1.5 text-primary-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha: search box — sin cambios internos */}
            <div>
              <div className="bg-card rounded-2xl overflow-visible shadow-lg border border-border/40">

                {/* Origen */}
                <div className="px-2 pt-2">
                  <CityCombobox
                    value={origin}
                    onChange={setOrigin}
                    placeholder={t('weMove.hero.selectOrigin')}
                    pinColor="text-primary"
                    disabled={locLoading}
                  />
                </div>

                <div className="mx-4 border-t border-border/50" />

                {/* Destino */}
                <div className="px-2">
                  <CityCombobox
                    value={destination}
                    onChange={setDestination}
                    placeholder={t('weMove.hero.selectDestination')}
                    excludeId={origin}
                    pinColor="text-destructive"
                    disabled={locLoading}
                  />
                </div>

                <div className="mx-4 border-t border-border/50" />

                {/* Fecha */}
                <div className="px-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'w-full h-12 flex items-center gap-3 px-4 text-sm font-medium',
                          'text-left rounded-xl transition-colors hover:bg-muted/50',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {date ? format(date, 'PP', { locale: es }) : t('weMove.hero.anyDay')}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border border-border rounded-xl" align="start">
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

                {/* Botón buscar */}
                <div className="px-3 pb-3">
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="w-full h-12 rounded-xl font-black text-sm gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {t('weMove.searchTransport')}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Transporter CTA bar — sin cambios */}
      <div className="relative border-t-2 border-primary-foreground/20 bg-primary-foreground/5">
        <div className="container py-3 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
          <p className="text-primary-foreground font-semibold text-sm text-center sm:text-left">
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
