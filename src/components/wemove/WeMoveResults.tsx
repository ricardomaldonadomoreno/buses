import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Star, ArrowRight, Users, Clock,
  ShieldCheck, Ticket, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeMoveRoute } from '@/hooks/useWeMoveData';
import { Link } from 'react-router-dom';

interface WeMoveResultsProps {
  routes: WeMoveRoute[] | undefined;
  isLoading: boolean;
  hasSearched: boolean;
}

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
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-foreground/20'}`} />
      ))}
      <span className="text-xs font-bold ml-1 text-foreground">
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-2 border-foreground/10 bg-card rounded-xl animate-pulse flex gap-4 p-4">
      <div className="w-24 h-20 bg-muted rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 bg-muted rounded w-24" />
          <div className="h-6 bg-muted rounded w-20" />
        </div>
      </div>
      <div className="flex flex-col items-end justify-between shrink-0">
        <div className="h-8 bg-muted rounded w-16" />
        <div className="h-9 bg-muted rounded w-24" />
      </div>
    </div>
  );
}

function RouteCard({ route }: { route: WeMoveRoute }) {
  const { t } = useTranslation();
  const departure    = new Date(route.departure_time);
  const vehicle      = getVehicle(route.vehicle_type);
  const seatsLeft    = route.available_seats;
  const isAlmostFull = seatsLeft > 0 && seatsLeft <= 3;
  const isFull       = seatsLeft === 0;

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isToday    = departure.toDateString() === today.toDateString();
  const isTomorrow = departure.toDateString() === tomorrow.toDateString();
  const dateLabel  = isToday
    ? t('weMove.results.today')
    : isTomorrow
    ? t('weMove.results.tomorrow')
    : format(departure, "EEE d 'de' MMM", { locale: es });

  const vehicleDesc = [route.vehicle_brand, route.vehicle_model, route.vehicle_year]
    .filter(Boolean).join(' ') || vehicle.label;

  return (
    <article className="group bg-card border-2 border-foreground/10 rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-150">
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

      <div className="flex gap-4 p-4">
        {/* Foto del vehículo */}
        <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/40 flex items-center justify-center">
          {route.vehicle_photo ? (
            <img src={route.vehicle_photo} alt={vehicleDesc} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{vehicle.emoji}</span>
          )}
        </div>

        {/* Info central */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-black text-sm leading-tight truncate">
              {route.transporter?.full_name ?? t('weMove.results.unknown')}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 shrink-0">
              <ShieldCheck className="h-3 w-3 text-green-600" />
              {t('weMove.results.verified')}
            </span>
          </div>

          <StarRating value={route.transporter?.rating ?? 0} />

          <p className="text-xs text-muted-foreground mt-1 truncate">{vehicleDesc}</p>

          <div className="flex items-center gap-1.5 mt-2 text-sm font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="truncate">{route.route?.origin?.name ?? '—'}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span className="truncate">{route.route?.destination?.name ?? '—'}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-lg">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold capitalize">{dateLabel}</span>
              <span className="font-black">{format(departure, 'HH:mm')}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
              isFull ? 'bg-red-50 text-red-700' : isAlmostFull ? 'bg-orange-50 text-orange-700' : 'bg-muted'
            }`}>
              <Users className="h-3 w-3" />
              <span className="font-black">{seatsLeft}</span>
              <span>{t('weMove.availableSeats')}</span>
            </div>
          </div>
        </div>

        {/* Precio + botón */}
        <div className="flex flex-col items-end justify-between shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('weMove.results.perSeat')}
            </p>
            <p className="text-3xl font-black text-primary leading-none">
              ${route.price.toFixed(0)}
              <span className="text-sm font-bold text-muted-foreground">
                .{String(Math.round((route.price % 1) * 100)).padStart(2, '0')}
              </span>
            </p>
          </div>

          <Button
            disabled={isFull}
            asChild={!isFull}
            size="sm"
            className="gap-1.5 font-bold mt-2"
          >
            {isFull ? (
              <><Ticket className="h-3.5 w-3.5" />{t('weMove.results.noSeats')}</>
            ) : (
              <Link to={`/wemove/booking/${route.id}`}>
                <Ticket className="h-3.5 w-3.5 mr-1.5 inline" />
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

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : count > 0 ? (
          <div className="space-y-3">
            {routes!.map((route) => <RouteCard key={route.id} route={route} />)}
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
