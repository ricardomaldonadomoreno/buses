import { useEffect, useState } from 'react';
import { getCurrencySymbol } from '@/lib/currencies';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowRight, Clock, Users, ShieldCheck,
  Star, MapPin, Ticket, AlertCircle, Loader2
} from 'lucide-react';

const VEHICLE_MAP: Record<string, { emoji: string; label: string }> = {
  bus:      { emoji: '🚌', label: 'Bus' },
  microbus: { emoji: '🚐', label: 'Microbus' },
  van:      { emoji: '🚙', label: 'Van' },
  minibus:  { emoji: '🚐', label: 'Minibus' },
  coaster:  { emoji: '🚌', label: 'Coaster' },
  sedan:    { emoji: '🚗', label: 'Sedan' },
  suv:      { emoji: '🚙', label: 'SUV' },
  boat:     { emoji: '⛵', label: 'Lancha' },
  plane:    { emoji: '✈️', label: 'Avioneta' },
};

function getVehicle(type?: string) {
  if (!type) return { emoji: '🚐', label: 'Vehículo' };
  return VEHICLE_MAP[type.toLowerCase()] ?? { emoji: '🚐', label: type };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-foreground/20'}`} />
      ))}
      <span className="text-sm font-bold ml-1">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

export default function WeMoveViaje() {
  const { routeId } = useParams<{ routeId: string }>();
  const [route, setRoute]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!routeId) return;
    supabase
      .from('wemove_routes')
      .select(`
        *,
        profiles:transporter_id (full_name, rating),
        transport_units:transport_unit_id (type, brand, model, year, photo_url),
        routes:route_id (
          origin:origin_location_id (name),
          destination:destination_location_id (name)
        )
      `)
      .eq('id', routeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setRoute(data); }
        setLoading(false);
      });
  }, [routeId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (notFound || !route) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-2xl font-black">Viaje no encontrado</h1>
      <p className="text-muted-foreground">Este enlace puede haber expirado o el viaje fue cancelado.</p>
      <Link to="/wemove" className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors">
        Buscar otros viajes
      </Link>
    </div>
  );

  const unit         = route.transport_units as any;
  const transporter  = route.profiles as any;
  const origin       = route.routes?.origin?.name ?? '—';
  const destination  = route.routes?.destination?.name ?? '—';
  const vehicle      = getVehicle(unit?.type);
  const departure    = new Date(route.departure_time);
  const seatsLeft    = route.available_seats;
  const isAlmostFull = seatsLeft > 0 && seatsLeft <= 3;
  const isFull       = seatsLeft === 0;
  const isCancelled  = route.status === 'cancelled';
  const isPast       = departure < new Date();
  // NUEVO: símbolo de moneda correcto
  const currencySymbol = getCurrencySymbol(route.currency);

  const vehicleDesc = [unit?.brand, unit?.model, unit?.year]
    .filter(Boolean).join(' ') || vehicle.label;

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isToday    = departure.toDateString() === today.toDateString();
  const isTomorrow = departure.toDateString() === tomorrow.toDateString();
  const dateLabel  = isToday ? 'Hoy'
    : isTomorrow ? 'Mañana'
    : format(departure, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header mínimo */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-14 items-center justify-between">
          <Link to="/wemove" className="font-serif text-lg font-semibold">
            We<span className="text-primary">Move</span>
          </Link>
          <Link to="/wemove" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver todos los viajes →
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-lg py-8 space-y-4">

        {isCancelled && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-4 w-4" /> Este viaje fue cancelado
          </div>
        )}
        {isPast && !isCancelled && (
          <div className="bg-muted px-4 py-2 rounded-xl flex items-center gap-2 text-muted-foreground text-sm font-bold">
            <Clock className="h-4 w-4" /> Este viaje ya partió
          </div>
        )}
        {isAlmostFull && !isFull && (
          <div className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-4 w-4" /> ¡Últimos {seatsLeft} asientos!
          </div>
        )}
        {isFull && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-4 w-4" /> Sin asientos disponibles
          </div>
        )}

        <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden">

          {/* Foto del vehículo */}
          <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
            {unit?.photo_url ? (
              <img src={unit.photo_url} alt={vehicleDesc} className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl">{vehicle.emoji}</span>
            )}
          </div>

          <div className="p-5 space-y-5">

            {/* Ruta */}
            <div className="flex items-center gap-3 text-xl font-black flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                {origin}
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" />
                {destination}
              </div>
            </div>

            {/* Fecha y asientos */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-muted px-3 py-2 rounded-xl text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold capitalize">{dateLabel}</span>
                <span className="font-black">{format(departure, 'HH:mm')}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm ${
                isFull ? 'bg-red-50 text-red-700' : isAlmostFull ? 'bg-orange-50 text-orange-700' : 'bg-muted'
              }`}>
                <Users className="h-4 w-4" />
                <span className="font-black">{seatsLeft}</span>
                <span>asientos disponibles</span>
              </div>
            </div>

            <div className="border-t border-border/40" />

            {/* Transportador */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-foreground/10 flex items-center justify-center text-xl font-black text-primary shrink-0">
                {transporter?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black">{transporter?.full_name ?? 'Transportador'}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Verificado
                  </span>
                </div>
                <StarRating value={transporter?.rating ?? 0} />
                <p className="text-xs text-muted-foreground mt-0.5">{vehicleDesc}</p>
              </div>
            </div>

            {/* Precio + CTA */}
            <div className="flex items-end justify-between pt-2 border-t border-border/40">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Por asiento</p>
                {/* CAMBIO: currencySymbol en lugar de $ hardcodeado */}
                <p className="text-4xl font-black text-primary leading-none">
                  {currencySymbol}{route.price.toFixed(0)}
                  <span className="text-base font-bold text-muted-foreground">
                    .{String(Math.round((route.price % 1) * 100)).padStart(2, '0')}
                  </span>
                </p>
              </div>

              {!isCancelled && !isPast && !isFull ? (
                <Link
                  to={`/wemove/booking/${routeId}`}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  <Ticket className="h-4 w-4" />
                  Reservar asiento
                </Link>
              ) : (
                <button disabled
                  className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground font-black rounded-xl text-sm cursor-not-allowed opacity-60">
                  <Ticket className="h-4 w-4" />
                  {isFull ? 'Sin asientos' : isCancelled ? 'Cancelado' : 'Viaje pasado'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground px-4">
          Este viaje es ofrecido por un transportador independiente verificado en{' '}
          <Link to="/wemove" className="text-primary font-bold hover:underline">WeMove</Link>.
        </p>
      </main>
    </div>
  );
}
