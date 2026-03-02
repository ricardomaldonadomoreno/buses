// src/pages/WeMoveBooking.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SeatSelector } from '@/components/wemove/SeatSelector';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteData {
  id: string;
  price: number;
  available_seats: number;
  departure_time: string;
  transporter_id: string;
  transport_unit: { type: string; capacity: number } | null;
  transporter: { full_name: string | null; rating: number | null } | null;
  route: {
    origin: { name: string } | null;
    destination: { name: string } | null;
  } | null;
}

interface BookingForm {
  name: string; email: string; phone: string; document: string;
  hasPet: boolean; hasExtraLuggage: boolean; notes: string;
}

export default function WeMoveBooking() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [takenSeats, setTakenSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string; boarding_code: string | null; payment_deadline: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', phone: '', document: '',
    hasPet: false, hasExtraLuggage: false, notes: ''
  });

  useEffect(() => {
    if (!routeId) return;
    const load = async () => {
      setLoading(true);
      setError(null);

      // Query simplificada — solo campos que existen en el schema
      const { data: r, error: routeErr } = await supabase
        .from('wemove_routes')
        .select(`
          id,
          price,
          available_seats,
          departure_time,
          transporter_id,
          transport_unit:transport_units ( type, capacity ),
          transporter:profiles!wemove_routes_transporter_id_fkey ( full_name, rating ),
          route:routes (
            origin:locations!routes_origin_location_id_fkey ( name ),
            destination:locations!routes_destination_location_id_fkey ( name )
          )
        `)
        .eq('id', routeId)
        .eq('status', 'active')
        .maybeSingle();       // maybeSingle → null si no existe, sin error 406

      if (routeErr) {
        console.error('Error cargando ruta:', routeErr);
        setError(`Error: ${routeErr.message}`);
        setLoading(false);
        return;
      }

      if (!r) {
        setError('Ruta no disponible o ya no está activa.');
        setLoading(false);
        return;
      }

      setRoute(r as RouteData);

      // Asientos ocupados
      const { data: bookings } = await supabase
        .from('wemove_bookings')
        .select('seat_number')
        .eq('route_id', routeId)
        .in('status', ['confirmed', 'paid']);

      setTakenSeats((bookings ?? []).map((b: any) => b.seat_number).filter(Boolean));
      setLoading(false);
    };

    load();
  }, [routeId]);

  const handleSubmit = async () => {
    if (!route || !selectedSeat || !form.name) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('wemove_bookings')
        .insert({
          route_id:           route.id,
          passenger_name:     form.name.trim(),
          passenger_email:    form.email || null,
          passenger_phone:    form.phone || null,
          passenger_document: form.document || null,
          seat_number:        selectedSeat,
          seat_label:         `Asiento ${selectedSeat}`,
          has_pet:            form.hasPet,
          has_extra_luggage:  form.hasExtraLuggage,
          passenger_notes:    form.notes || null,
          status:             'confirmed',
        })
        .select('id, boarding_code, payment_deadline')
        .single();

      if (err) throw err;
      setBookingResult(data);
      setStep(3);
    } catch (e: any) {
      console.error('Error al reservar:', e);
      setError(e?.message ?? 'Error al crear la reserva. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING ──
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando viaje...</p>
      </div>
    </div>
  );

  // ── ERROR SIN RUTA ──
  if (!route) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-4">
        <p className="text-4xl">😕</p>
        <p className="font-black text-lg">Ruta no disponible</p>
        <p className="text-sm text-muted-foreground">{error ?? 'Esta ruta ya no está activa o no existe.'}</p>
        <Link to="/wemove"
          className="inline-flex items-center gap-2 border-2 border-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver a WeMove
        </Link>
      </div>
    </div>
  );

  const capacity   = route.transport_unit?.capacity ?? 20;
  const origin     = route.route?.origin?.name ?? '—';
  const destination = route.route?.destination?.name ?? '—';
  const departure  = format(new Date(route.departure_time), "d 'de' MMMM · HH:mm", { locale: es });

  // ── STEP 3: ÉXITO ──
  if (step === 3 && bookingResult) {
    const deadline = bookingResult.payment_deadline
      ? format(new Date(bookingResult.payment_deadline), "d 'de' MMMM · HH:mm", { locale: es })
      : null;

    // Buscar teléfono del transportador en tabla users
    const whatsappMsg = encodeURIComponent(
      `Hola, reservé el asiento ${selectedSeat} (código ${bookingResult.boarding_code ?? '—'}) en el viaje ${origin} → ${destination} del ${departure}. Quisiera coordinar el pago.`
    );

    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary border-b-4 border-foreground">
          <div className="container flex items-center justify-between py-4">
            <Link to="/wemove" className="text-2xl font-black text-primary-foreground">WeMove</Link>
          </div>
        </div>
        <main className="container max-w-lg py-10 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 border-4 border-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black">¡Reserva confirmada!</h1>
            <p className="text-muted-foreground mt-1 text-sm">{origin} → {destination} · {departure}</p>
          </div>

          {/* Código de embarque */}
          <div className="border-4 border-foreground rounded-2xl p-6 text-center bg-primary/5">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Código de embarque</p>
            <p className="text-6xl font-black tracking-[0.3em] text-primary">{bookingResult.boarding_code ?? '—'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Asiento <span className="font-black text-foreground">{selectedSeat}</span> ·{' '}
              {route.transport_unit?.type}
            </p>
          </div>

          {/* Deadline */}
          {deadline && (
            <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800 mb-1">
                <Clock className="h-4 w-4 shrink-0" />
                <p className="font-bold text-sm">Coordina tu pago antes de:</p>
              </div>
              <p className="font-black text-lg text-amber-900">{deadline}</p>
              <p className="text-xs text-amber-700 mt-1">
                Si el pago no se confirma, tu asiento se libera automáticamente.
              </p>
            </div>
          )}

          <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-black text-sm px-6 py-4 rounded-xl hover:bg-green-600 transition-colors w-full">
            💬 Contactar al transportador por WhatsApp
          </a>

          <Link to="/wemove"
            className="flex items-center justify-center gap-2 border-2 border-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-muted transition-colors w-full">
            <ArrowLeft className="h-4 w-4" /> Volver a WeMove
          </Link>
        </main>
      </div>
    );
  }

  // ── PASOS 1 y 2 ──
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary border-b-4 border-foreground">
        <div className="container flex items-center justify-between py-4">
          <Link to="/wemove" className="text-2xl font-black text-primary-foreground">WeMove</Link>
        </div>
      </div>

      <main className="container max-w-lg py-8">

        {/* Info del viaje */}
        <div className="mb-6">
          <Link to="/wemove" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Link>
          <div className="flex items-center gap-2 font-bold text-sm">
            <MapPin className="h-4 w-4 text-primary" />{origin}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <MapPin className="h-4 w-4 text-destructive" />{destination}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{departure}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Bs. {route.price.toFixed(0)} / asiento</span>
          </div>
          {route.transporter?.full_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Chofer: <span className="font-bold text-foreground">{route.transporter.full_name}</span>
              {route.transporter.rating ? ` · ⭐ ${route.transporter.rating}` : ''}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {(['Elige asiento', 'Tus datos', 'Confirmar'] as const).map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 shrink-0',
                  step > i + 1 ? 'bg-green-500 border-green-500 text-white'
                  : step === i + 1 ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted border-border text-muted-foreground'
                )}>
                  {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs font-bold whitespace-nowrap hidden sm:block',
                  step === i + 1 ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={cn('flex-1 h-0.5 mx-2', step > i + 1 ? 'bg-green-500' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Selector de asientos ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black">Elige tu asiento</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {takenSeats.length} ocupados · {capacity - takenSeats.length} disponibles de {capacity}
              </p>
            </div>

            <SeatSelector
              totalSeats={capacity}
              takenSeats={takenSeats}
              selectedSeat={selectedSeat}
              onSelect={(n) => setSelectedSeat(n === 0 ? null : n)}
              vehicleType={route.transport_unit?.type}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!selectedSeat}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm">
              Continuar con asiento {selectedSeat ?? '—'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Datos del pasajero ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">Tus datos</h2>
              <p className="text-sm text-muted-foreground">Asiento {selectedSeat} · Bs. {route.price.toFixed(0)}</p>
            </div>

            <div className="space-y-4">
              <Field label="Nombre completo *" required>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Tu nombre completo"
                  className="w-full border-2 border-foreground rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Email (para recibir confirmación)">
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="tucorreo@email.com"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Teléfono">
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  placeholder="+591 7XXXXXXX"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Número de documento">
                <input value={form.document} onChange={e => setForm(f => ({...f, document: e.target.value}))}
                  placeholder="CI / Pasaporte"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Toggle active={form.hasPet} onClick={() => setForm(f => ({...f, hasPet: !f.hasPet}))}>
                  🐾 Con mascota
                </Toggle>
                <Toggle active={form.hasExtraLuggage} onClick={() => setForm(f => ({...f, hasExtraLuggage: !f.hasExtraLuggage}))}>
                  🧳 Equipaje extra
                </Toggle>
              </div>

              <Field label="Comentarios adicionales">
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Ej: subo en terminal, llevo silla de ruedas..."
                  rows={3}
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background resize-none" />
              </Field>
            </div>

            {error && (
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-sm text-destructive font-bold">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="flex-1 border-2 border-foreground rounded-xl py-4 font-bold text-sm hover:bg-muted transition-colors">
                ← Editar asiento
              </button>
              <button onClick={handleSubmit}
                disabled={!form.name.trim() || submitting}
                className="flex-[2] bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Confirmando...</>
                  : 'Confirmar reserva ✓'
                }
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers de UI
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn('border-2 rounded-xl py-3 px-4 text-sm font-bold text-left transition-all',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/40')}>
      {active && '✓ '}{children}
    </button>
  );
}
