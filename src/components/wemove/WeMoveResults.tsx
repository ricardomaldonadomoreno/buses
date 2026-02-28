import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Star, ArrowRight, Users, Clock,
  ShieldCheck, MapPin, Ticket, Bus,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeMoveRoute } from '@/hooks/useWeMoveData';
import { Link } from 'react-router-dom';

interface WeMoveResultsProps {
  routes: WeMoveRoute[] | undefined;
  isLoading: boolean;
  hasSearched: boolean;
}

// Map vehicle types to emoji + label
const VEHICLE_MAP: Record<string, { emoji: string; label: string }> = {
  bus:      { emoji: '🚌', label: 'Bus' },
  microbus: { emoji: '🚐', label: 'Microbus' },
  van:      { emoji: '🚙', label: 'Van' },
  minibus:  { emoji: '🚐', label: 'Minibus' },
  coaster:  { emoji: '🚌', label: 'Coaster' },
  sedan:    { emoji: '🚗', label: 'Sedan' },
  suv:      { emoji: '🚙', label: 'SUV' },
};

function getVehicle(type?: string) {
  if (!type) return { emoji: '🚐', label: 'Vehículo' };
  return VEHICLE_MAP[type.toLowerCase()] ?? { emoji: '🚐', label: type };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= Math.round(value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-foreground/20'
          }`}
        />
      ))}
      <span className="text-xs font-bold ml-1 text-foreground">
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-4 border-foreground/20 bg-card animate-pulse">
      <div className="h-1 bg-foreground/10 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-7 bg-muted rounded w-28" />
          <div className="h-7 bg-muted rounded w-24" />
        </div>
        <div className="h-px bg-muted" />
        <div className="flex justify-between items-end">
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-10 bg-muted rounded w-28" />
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: WeMoveRoute }) {
  const { t } = useTranslation();
  const departure = new Date(route.departure_time);
  const vehicle = getVehicle(undefined); // vehicle type not yet in WeMoveRoute interface — graceful fallback
  const seatsLeft = route.available_seats;
  const isAlmostFull = seatsLeft > 0 && seatsLeft <= 3;
  const isFull = seatsLeft === 0;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = departure.toDateString() === today.toDateString();
  const isTomorrow = departure.toDateString() === tomorrow.toDateString();

  const dateLabel = isToday
    ? t('weMove.results.today')
    : isTomorrow
    ? t('weMove.results.tomorrow')
    : format(departure, "EEE d 'de' MMM", { locale: es });

  return (
    <article className="group relative border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground))] hover:shadow-[6px_6px_0px_0px_hsl(var(--foreground))] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100">
      {/* Top accent */}
      <div className="h-1.5 bg-primary w-full" />

      {/* Almost full warning */}
      {isAlmostFull && (
        <div className="bg-orange-500 px-4 py-1 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-white" />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">
            {t('weMove.results.almostFull', { seats: seatsLeft })}
          </span>
        </div>
      )}
      {isFull && (
        <div className="bg-red-500 px-4 py-1 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-white" />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">
            {t('weMove.results.full')}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* ── ROW 1: Transporter info ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-foreground flex items-center justify-center font-black text-xl text-primary shrink-0">
              {route.transporter?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="font-black text-base leading-tight">
                {route.transporter?.full_name ?? t('weMove.results.unknown')}
              </div>
              <StarRating value={route.transporter?.rating ?? 0} />
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                  {t('weMove.results.verified')}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle pill */}
          <div className="text-center bg-muted border-2 border-foreground px-3 py-2 shrink-0">
            <div className="text-2xl leading-none mb-0.5">{vehicle.emoji}</div>
            <div className="text-[10px] font-black uppercase tracking-wide text-foreground">
              {vehicle.label}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Route ── */}
        <div className="flex items-center gap-2 mb-4 bg-muted/50 border-2 border-foreground/20 px-4 py-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="font-black text-base truncate">
              {route.route?.origin?.name ?? '—'}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-1" />
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
            <span className="font-black text-base truncate">
              {route.route?.destination?.name ?? '—'}
            </span>
          </div>
        </div>

        {/* ── ROW 3: Details chips ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Date & time */}
          <div className="flex items-center gap-1.5 bg-background border-2 border-foreground/30 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold capitalize">{dateLabel}</span>
            <span className="text-sm font-black">{format(departure, 'HH:mm')}</span>
          </div>

          {/* Seats */}
          <div className={`flex items-center gap-1.5 border-2 px-3 py-1.5 ${
            isFull
              ? 'bg-red-50 border-red-300 text-red-700'
              : isAlmostFull
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-background border-foreground/30'
          }`}>
            <Users className={`h-3.5 w-3.5 ${
              isFull ? 'text-red-500' : isAlmostFull ? 'text-orange-500' : 'text-muted-foreground'
            }`} />
            <span className="text-sm font-black">{seatsLeft}</span>
            <span className="text-sm text-muted-foreground">{t('weMove.availableSeats')}</span>
          </div>
        </div>

        {/* ── ROW 4: Price + CTA ── */}
        <div className="flex items-end justify-between pt-4 border-t-2 border-foreground/10">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              {t('weMove.results.perSeat')}
            </div>
            <div className="text-4xl font-black text-primary leading-none">
              ${route.price.toFixed(0)}
              <span className="text-base font-bold text-muted-foreground">
                .{String(Math.round((route.price % 1) * 100)).padStart(2, '0')}
              </span>
            </div>
          </div>

          <Button
            disabled={isFull}
            asChild={!isFull}
            className="border-2 border-foreground gap-2 font-bold shadow-[3px_3px_0px_0px_hsl(var(--foreground))] hover:shadow-[1px_1px_0px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFull ? (
              <>
                <Ticket className="h-4 w-4" />
                {t('weMove.results.noSeats')}
              </>
            ) : (
              <Link to={`/wemove/booking/${route.id}`}>
                <Ticket className="h-4 w-4 mr-2 inline" />
                {t('weMove.results.reserve')}
              </Link>
            )}
          </Button>          
        </div>
      </div>
    </article>
  );
}

export function WeMoveResults({ routes, isLoading, hasSearched }: WeMoveResultsProps) {
  const { t } = useTranslation();

  if (!hasSearched) return null;

  const count = routes?.length ?? 0;

  return (
    <section className="py-10 border-b-4 border-foreground bg-muted/30">
      <div className="container max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black">{t('weMove.resultsTitle')}</h2>
            {!isLoading && count > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {count} {count === 1 ? t('weMove.results.tripFound') : t('weMove.results.tripsFound')}
              </p>
            )}
          </div>
          {!isLoading && count > 0 && (
            <div className="bg-primary text-primary-foreground border-2 border-foreground px-3 py-1.5 font-black text-sm shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
              {count} {count === 1 ? t('weMove.results.trip') : t('weMove.results.trips')}
            </div>
          )}
        </div>

        {/* States */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : count > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes!.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <div className="border-4 border-foreground bg-card p-12 text-center shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-black text-xl mb-2">{t('weMove.noRoutesFound')}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('weMove.results.tryOtherDate')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
