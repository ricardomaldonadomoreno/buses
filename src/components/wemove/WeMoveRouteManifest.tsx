// src/components/wemove/WeMoveRouteManifest.tsx
// Planilla de pasajeros para el chofer — vista completa por viaje

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Users, CheckCircle, Clock, AlertTriangle, XCircle,
  Dog, Luggage, MessageSquare, Printer, ArrowLeft
} from 'lucide-react';

interface Booking {
  id: string;
  passenger_name: string;
  passenger_email: string | null;
  passenger_phone: string | null;
  passenger_document: string | null;
  seat_number: number;
  seat_label: string;
  has_pet: boolean;
  has_extra_luggage: boolean;
  passenger_notes: string | null;
  status: string;
  payment_deadline: string;
  paid_at: string | null;
  commission_amount: number | null;
  boarding_code: string | null;
  is_overdue: boolean;
  hours_until_deadline: number;
  price: number;
}

interface RouteInfo {
  id: string;
  departure_time: string;
  price: number;
  available_seats: number;
  transport_unit: { type: string; capacity: number };
  route: {
    origin: { name: string };
    destination: { name: string };
  };
}

interface WeMoveRouteManifestProps {
  routeId: string;
  userId: string;
  onBack?: () => void;
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: 'Pendiente pago', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <Clock className="h-3 w-3" /> },
  paid:      { label: 'Pagado ✓',       color: 'bg-green-100 text-green-800 border-green-400', icon: <CheckCircle className="h-3 w-3" /> },
  expired:   { label: 'Expirado',       color: 'bg-red-100 text-red-700 border-red-300',       icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelado',      color: 'bg-gray-100 text-gray-500 border-gray-300',    icon: <XCircle className="h-3 w-3" /> },
};

export function WeMoveRouteManifest({ routeId, userId, onBack }: WeMoveRouteManifestProps) {
  const [route, setRoute]       = useState<RouteInfo | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [marking, setMarking]   = useState<string | null>(null);
  const [view, setView]         = useState<'list' | 'map'>('list');

  const load = async () => {
    // Ruta
    const { data: r } = await supabase
      .from('wemove_routes')
      .select(`
        id, departure_time, price, available_seats,
        transport_unit:transport_units(type, capacity),
        route:routes(
          origin:locations!routes_origin_location_id_fkey(name),
          destination:locations!routes_destination_location_id_fkey(name)
        )
      `)
      .eq('id', routeId).single();
    setRoute(r as any);

    // Reservas via vista
    const { data: b } = await supabase
      .from('vw_transporter_bookings')
      .select('*')
      .eq('route_id', routeId)
      .order('seat_number');
    setBookings((b ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [routeId]);

  const markPaid = async (bookingId: string) => {
    setMarking(bookingId);
    await supabase.rpc('mark_booking_paid', {
      p_booking_id: bookingId,
      p_transporter_user_id: userId,
    });
    await load();
    setMarking(null);
  };

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Cargando planilla...</div>;
  if (!route) return null;

  const origin = route.route?.origin?.name;
  const destination = route.route?.destination?.name;
  const capacity = route.transport_unit?.capacity ?? 20;
  const paid = bookings.filter(b => b.status === 'paid');
  const pending = bookings.filter(b => b.status === 'confirmed');
  const takenSeats = bookings.filter(b => ['confirmed','paid'].includes(b.status)).map(b => b.seat_number);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </button>
          )}
          <h2 className="text-2xl font-black">{origin} → {destination}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(route.departure_time), "d 'de' MMMM · HH:mm", { locale: es })} ·{' '}
            {route.transport_unit?.type} · {capacity} asientos
          </p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 border-2 border-foreground px-4 py-2 text-sm font-bold hover:bg-muted transition-colors rounded-lg print:hidden">
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Asientos', value: capacity, color: 'text-foreground' },
          { label: 'Reservados', value: bookings.filter(b=>['confirmed','paid'].includes(b.status)).length, color: 'text-blue-600' },
          { label: 'Pagados', value: paid.length, color: 'text-green-600' },
          { label: 'Libres', value: route.available_seats, color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border-2 border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Toggle vista */}
      <div className="flex gap-2 border-2 border-border rounded-xl p-1 w-fit">
        <button onClick={() => setView('list')}
          className={cn('px-4 py-1.5 text-xs font-black rounded-lg transition-all',
            view === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
          Lista
        </button>
        <button onClick={() => setView('map')}
          className={cn('px-4 py-1.5 text-xs font-black rounded-lg transition-all',
            view === 'map' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
          Mapa de asientos
        </button>
      </div>

      {/* ── VISTA MAPA ── */}
      {view === 'map' && (
        <div className="bg-muted/30 border-2 border-border rounded-2xl p-6">
          <SeatMapReadOnly
            capacity={capacity}
            bookings={bookings.filter(b => ['confirmed','paid'].includes(b.status))}
            vehicleType={route.transport_unit?.type}
          />
        </div>
      )}

      {/* ── VISTA LISTA ── */}
      {view === 'list' && (
        <div className="space-y-3">
          {bookings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin reservas todavía</p>
            </div>
          )}

          {bookings.map(b => {
            const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.confirmed;
            const overdue = b.is_overdue;
            return (
              <div key={b.id}
                className={cn('border-2 rounded-2xl p-4 space-y-3 transition-all',
                  overdue && b.status === 'confirmed' ? 'border-red-300 bg-red-50/40'
                  : b.status === 'paid' ? 'border-green-300 bg-green-50/20'
                  : 'border-border bg-card')}>

                {/* Fila 1: asiento + nombre + estado */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
                      <span className="font-black text-primary text-sm">{b.seat_number}</span>
                    </div>
                    <div>
                      <p className="font-black text-sm">{b.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">{b.passenger_phone ?? b.passenger_email ?? '—'}</p>
                      {b.passenger_document && <p className="text-xs text-muted-foreground">CI: {b.passenger_document}</p>}
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0', cfg.color)}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {/* Fila 2: Extras */}
                {(b.has_pet || b.has_extra_luggage || b.passenger_notes) && (
                  <div className="flex flex-wrap gap-2">
                    {b.has_pet && (
                      <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-bold">
                        <Dog className="h-3 w-3" /> Mascota
                      </span>
                    )}
                    {b.has_extra_luggage && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-300 px-2 py-0.5 rounded-full font-bold">
                        <Luggage className="h-3 w-3" /> Equipaje extra
                      </span>
                    )}
                    {b.passenger_notes && (
                      <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                        <MessageSquare className="h-3 w-3" /> {b.passenger_notes}
                      </span>
                    )}
                  </div>
                )}

                {/* Fila 3: Precio + deadline */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-base text-primary">Bs. {b.price.toFixed(0)}</span>
                  {b.status === 'confirmed' && (
                    <span className={cn('flex items-center gap-1', overdue ? 'text-red-600' : 'text-muted-foreground')}>
                      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {overdue ? 'Plazo vencido' : `${Math.max(0, b.hours_until_deadline).toFixed(0)}h restantes`}
                    </span>
                  )}
                  {b.status === 'paid' && b.commission_amount && (
                    <span className="text-muted-foreground">
                      Comisión: <span className="text-red-500">-Bs. {b.commission_amount.toFixed(2)}</span>
                      {' '}· Neto: <span className="text-green-600 font-black">Bs. {(b.price - b.commission_amount).toFixed(2)}</span>
                    </span>
                  )}
                </div>

                {/* Acción: marcar pagado */}
                {b.status === 'confirmed' && (
                  <button onClick={() => markPaid(b.id)} disabled={marking === b.id}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-black py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                    {marking === b.id
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                      : <><CheckCircle className="h-4 w-4" /> Confirmar pago recibido</>
                    }
                  </button>
                )}
                {b.status === 'paid' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Pagado el {format(new Date(b.paid_at!), "d MMM · HH:mm", { locale: es })} · Código: {b.boarding_code}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mapa visual de asientos (solo lectura, para el chofer)
function SeatMapReadOnly({ capacity, bookings, vehicleType }: {
  capacity: number; bookings: Booking[]; vehicleType?: string;
}) {
  const paidSeats = bookings.filter(b => b.status === 'paid').map(b => b.seat_number);
  const pendingSeats = bookings.filter(b => b.status === 'confirmed').map(b => b.seat_number);

  const cols = capacity <= 8 ? 2 : capacity <= 20 ? 3 : 4;
  const leftCols = cols >= 4 ? 2 : 1;
  const rightCols = cols >= 4 ? 2 : cols - 1;
  const seatsPerRow = leftCols + rightCols;
  const rows = Math.ceil(capacity / seatsPerRow);
  const seats = Array.from({ length: capacity }, (_, i) => i + 1);

  return (
    <div>
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs font-bold">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-400 border-2 border-green-600" />Pagado</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-300 border-2 border-amber-500" />Pendiente pago</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-muted border-2 border-border" />Libre</span>
      </div>
      <div className="max-w-xs mx-auto bg-background border-4 border-foreground/20 rounded-3xl p-4 space-y-2">
        <div className="text-center text-[10px] font-black text-muted-foreground mb-3 pb-2 border-b border-dashed border-foreground/20">
          🚌 FRENTE
        </div>
        {Array.from({ length: rows }, (_, row) => {
          const start = row * seatsPerRow;
          const left = seats.slice(start, start + leftCols);
          const right = seats.slice(start + leftCols, start + seatsPerRow);
          return (
            <div key={row} className="flex items-center gap-2 justify-center">
              <div className="flex gap-1.5">
                {left.map(n => <SeatChip key={n} n={n} paid={paidSeats.includes(n)} pending={pendingSeats.includes(n)} booking={bookings.find(b=>b.seat_number===n)} />)}
              </div>
              <div className="w-4 flex justify-center"><div className="w-1 h-5 bg-foreground/10 rounded" /></div>
              <div className="flex gap-1.5">
                {right.map(n => n <= capacity ? <SeatChip key={n} n={n} paid={paidSeats.includes(n)} pending={pendingSeats.includes(n)} booking={bookings.find(b=>b.seat_number===n)} /> : <div key={n} className="w-9 h-9" />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeatChip({ n, paid, pending, booking }: { n: number; paid: boolean; pending: boolean; booking?: Booking }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setShowTip(s => !s)}
        title={booking ? `${booking.passenger_name}` : `Asiento ${n} libre`}
        className={cn(
          'w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all',
          paid    ? 'bg-green-400 border-green-600 text-white'
          : pending ? 'bg-amber-300 border-amber-500 text-amber-900'
          : 'bg-muted border-border text-muted-foreground'
        )}>
        {n}
      </button>
      {showTip && booking && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-[10px] font-bold rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-lg">
          {booking.passenger_name}
          {booking.has_pet && ' 🐾'}
          {booking.has_extra_luggage && ' 🧳'}
        </div>
      )}
    </div>
  );
}
