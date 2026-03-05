// src/pages/WeMoveBooking.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SeatSelector, SeatLayout } from '@/components/wemove/SeatSelector';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Calendar, DollarSign, Bus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/currencies';

// ── Tipos ──
interface RouteData {
  id:              string;
  trip_code:       string | null;
  price:           number;
  currency:        string | null;
  available_seats: number;
  departure_time:  string;
  transporter_id:  string;
  notes:           string | null;
  transport_unit: {
    type:        string;
    capacity:    number;
    plate:       string | null;
    color:       string | null;
    seat_layout: SeatLayout | null;
  } | null;
  transporter: {
    full_name: string | null;
    rating:    number | null;
  } | null;
  route: {
    origin:      { name: string } | null;
    destination: { name: string } | null;
  } | null;
}

interface BookingForm {
  name:             string;
  email:            string;
  phone:            string;
  document:         string;
  hasPet:           boolean;
  hasExtraLuggage:  boolean;
  notes:            string;
}

interface BookingResult {
  id:               string;
  boarding_code:    string | null;
  payment_deadline: string | null;
}

type Step = 1 | 2 | 3 | 4; // 1=asiento 2=datos 3=confirmado 4=registro opcional

export default function WeMoveBooking() {
  const { routeId } = useParams<{ routeId: string }>();

  const [step, setStep]               = useState<Step>(1);
  const [route, setRoute]             = useState<RouteData | null>(null);
  const [takenSeats, setTakenSeats]   = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [pageError, setPageError]     = useState<string | null>(null);
  const [formError, setFormError]     = useState<string | null>(null);

  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', phone: '', document: '',
    hasPet: false, hasExtraLuggage: false, notes: ''
  });

  // Registro opcional post-reserva
  const [regPassword, setRegPassword]   = useState('');
  const [regLoading, setRegLoading]     = useState(false);
  const [regError, setRegError]         = useState<string | null>(null);
  const [regDone, setRegDone]           = useState(false);

  // ── Cargar ruta ──
  useEffect(() => {
    if (!routeId) return;
    const load = async () => {
      setLoading(true);
      setPageError(null);

      const { data, error } = await supabase
        .from('wemove_routes')
        .select(`
          id,
          trip_code,
          price,
          available_seats,
          departure_time,
          transporter_id,
          notes,
          transport_unit:transport_units (
            type, capacity, plate, color, seat_layout
          ),
          transporter:profiles!wemove_routes_transporter_id_fkey (
            full_name, rating
          ),
          route:routes (
            origin:locations!routes_origin_location_id_fkey ( name ),
            destination:locations!routes_destination_location_id_fkey ( name )
          )
        `)
        .eq('id', routeId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('Error cargando ruta:', error);
        setPageError(`Error al cargar el viaje: ${error.message}`);
        setLoading(false);
        return;
      }
      if (!data) {
        setPageError('Este viaje ya no está disponible o no existe.');
        setLoading(false);
        return;
      }

      setRoute(data as RouteData);

      // Asientos ya ocupados
      const { data: bookings } = await supabase
        .from('wemove_bookings')
        .select('seat_label')
        .eq('route_id', routeId)
        .in('status', ['confirmed', 'paid']);

      setTakenSeats(
        (bookings ?? [])
          .map((b: any) => b.seat_label)
          .filter(Boolean)
      );

      setLoading(false);
    };
    load();
  }, [routeId]);

  // ── Confirmar reserva ──
  const handleSubmit = async () => {
    if (!route || !selectedSeat || !form.name.trim()) return;
    setSubmitting(true);
    setFormError(null);

    const { data, error } = await supabase
      .from('wemove_bookings')
      .insert({
        route_id:           route.id,
        passenger_name:     form.name.trim(),
        passenger_email:    form.email || null,
        passenger_phone:    form.phone || null,
        passenger_document: form.document || null,
        seat_number:        parseInt(selectedSeat) || null,
        seat_label:         selectedSeat,
        has_pet:            form.hasPet,
        has_extra_luggage:  form.hasExtraLuggage,
        passenger_notes:    form.notes || null,
        status:             'confirmed',
      })
      .select('id, boarding_code, payment_deadline')
      .single();

    setSubmitting(false);

    if (error) {
      console.error('Error al reservar:', error);
      if (error.code === '23505') {
        setFormError('Ese asiento acaba de ser reservado por otra persona. Por favor elige otro.');
      } else {
        setFormError(`Error al crear la reserva: ${error.message}`);
      }
      return;
    }

    setBookingResult(data);
    setStep(3);
  };

  // ── Registro opcional del pasajero ──
  const handleRegister = async () => {
    if (!form.email || !regPassword || !bookingResult) return;
    setRegLoading(true);
    setRegError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    form.email,
      password: regPassword,
      options: {
        data: {
          first_name: form.name.split(' ')[0] ?? form.name,
          last_name:  form.name.split(' ').slice(1).join(' ') ?? '',
        }
      }
    });

    if (authError) {
      setRegError(authError.message);
      setRegLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      // Crear passenger_account
      await supabase.from('passenger_accounts').insert({
        auth_user_id: userId,
        email:        form.email,
        first_name:   form.name.split(' ')[0] ?? form.name,
        last_name:    form.name.split(' ').slice(1).join(' ') ?? '',
        phone:        form.phone || null,
        document:     form.document || null,
      });

      // Vincular la reserva al usuario
      await supabase
        .from('wemove_bookings')
        .update({ passenger_user_id: userId })
        .eq('id', bookingResult.id);
    }

    setRegLoading(false);
    setRegDone(true);
  };

  // ── LOADING ──
  if (loading) return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando viaje...</p>
      </div>
    </PageShell>
  );

  // ── ERROR ──
  if (!route) return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="text-5xl">😕</span>
        <p className="font-black text-lg">Viaje no disponible</p>
        <p className="text-sm text-muted-foreground max-w-xs">{pageError ?? 'Este viaje ya no está activo.'}</p>
        <Link to="/wemove" className="flex items-center gap-2 border-2 border-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Volver a WeMove
        </Link>
      </div>
    </PageShell>
  );

  const origin      = route.route?.origin?.name ?? '—';
  const destination = route.route?.destination?.name ?? '—';
  const departure   = format(new Date(route.departure_time), "d 'de' MMMM · HH:mm", { locale: es });
  const layout      = route.transport_unit?.seat_layout ?? null;
  const capacity    = route.transport_unit?.capacity ?? 20;

  // ── STEP 3: CONFIRMADO ──
  if (step === 3 && bookingResult) {
    const deadline = bookingResult.payment_deadline
      ? format(new Date(bookingResult.payment_deadline), "d 'de' MMMM · HH:mm", { locale: es })
      : null;

    const whatsappText = encodeURIComponent(
      `Hola${route.transporter?.full_name ? ' ' + route.transporter.full_name : ''}, acabo de reservar el asiento ${selectedSeat} (código ${bookingResult.boarding_code ?? '—'}) en el viaje ${route.trip_code ?? ''} ${origin} → ${destination} del ${departure}. ¿Cómo coordino el pago?`
    );

    return (
      <PageShell>
        <div className="max-w-lg mx-auto space-y-5 py-8">
          {/* Éxito */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-100 border-4 border-green-400 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black">¡Reserva confirmada!</h1>
            <p className="text-sm text-muted-foreground">{origin} → {destination} · {departure}</p>
          </div>

          {/* Ficha de la reserva */}
          <div className="border-4 border-foreground rounded-2xl overflow-hidden">
            {/* Encabezado dorado */}
            <div className="bg-primary px-5 py-3 flex items-center justify-between">
              <span className="text-primary-foreground font-black text-sm">
                {route.trip_code ?? 'WeMove'}
              </span>
              <span className="text-primary-foreground/70 text-xs font-bold">
                {route.transport_unit?.type} {route.transport_unit?.plate ? `· ${route.transport_unit.plate}` : ''}
                {route.transport_unit?.color ? ` · ${route.transport_unit.color}` : ''}
              </span>
            </div>
            {/* Cuerpo */}
            <div className="bg-primary/5 px-5 py-5 text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Código de embarque</p>
              <p className="text-6xl font-black tracking-[0.3em] text-primary">{bookingResult.boarding_code ?? '—'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Asiento <span className="font-black text-foreground">{selectedSeat}</span>
              </p>
            </div>
            {/* Footer */}
            <div className="border-t-2 border-foreground/10 px-5 py-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Pasajero</p>
                <p className="font-bold">{form.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Precio</p>
                <p className="font-black text-primary">{getCurrencySymbol(route.currency)}{route.price.toFixed(0)}</p>
              </div>
              {route.transporter?.full_name && (
                <div>
                  <p className="text-muted-foreground">Chofer</p>
                  <p className="font-bold">{route.transporter.full_name}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Pago</p>
                <p className="font-bold text-amber-600">Al momento del viaje</p>
              </div>
            </div>
          </div>

          {/* Deadline */}
          {deadline && (
            <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-4 w-4 shrink-0" />
                <p className="font-bold text-sm">Coordina el pago antes de:</p>
              </div>
              <p className="font-black text-lg text-amber-900 pl-6">{deadline}</p>
              <p className="text-xs text-amber-700 pl-6">
                Si el chofer no confirma tu pago a tiempo, el asiento se libera automáticamente.
              </p>
            </div>
          )}

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-black text-sm px-6 py-4 rounded-xl hover:bg-green-600 transition-colors w-full"
          >
            💬 Contactar al transportador por WhatsApp
          </a>

          {/* Registro opcional */}
          {!regDone && form.email && (
            <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-5 space-y-3">
              <div>
                <p className="font-black text-sm">¿Quieres guardar tu historial de viajes?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Crea tu cuenta gratis y recibe alertas de rutas de retorno, descuentos y beneficios exclusivos.
                </p>
              </div>
              {regError && <p className="text-xs text-destructive font-bold">{regError}</p>}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Email: <span className="font-bold text-foreground">{form.email}</span>
                </p>
                <input
                  type="password"
                  placeholder="Elige una contraseña"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-background"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegister}
                  disabled={!regPassword || regLoading}
                  className="flex-1 bg-primary text-primary-foreground font-black text-sm py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {regLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2.5 text-sm text-muted-foreground border-2 border-border rounded-xl hover:bg-muted transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}

          {regDone && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl px-4 py-3 text-sm text-green-800 font-bold text-center">
              ✓ Cuenta creada. Revisa tu email para confirmarla.
            </div>
          )}

          <Link to="/wemove"
            className="flex items-center justify-center gap-2 border-2 border-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-muted transition-colors w-full"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a WeMove
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── STEPS 1 y 2 ──
  return (
    <PageShell>
      <div className="max-w-lg mx-auto py-8">

        {/* Volver */}
        <Link to="/wemove" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Link>

        {/* Info del viaje */}
        <div className="border-2 border-foreground/15 rounded-2xl p-4 mb-6 bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-base">
              <MapPin className="h-4 w-4 text-primary shrink-0" />{origin}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <MapPin className="h-4 w-4 text-destructive shrink-0" />{destination}
            </div>
            {route.trip_code && (
              <span className="text-xs font-black text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                {route.trip_code}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{departure}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{getCurrencySymbol(route.currency)}{route.price.toFixed(0)} / asiento</span>
            {route.transport_unit && (
              <span className="flex items-center gap-1">
                <Bus className="h-3 w-3" />
                {route.transport_unit.type}
                {route.transport_unit.plate ? ` · ${route.transport_unit.plate}` : ''}
                {route.transport_unit.color ? ` · ${route.transport_unit.color}` : ''}
              </span>
            )}
          </div>
          {route.transporter?.full_name && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-foreground">{route.transporter.full_name}</span>
              {route.transporter.rating ? (
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {route.transporter.rating}
                </span>
              ) : null}
            </div>
          )}
          {route.notes && (
            <p className="text-xs text-muted-foreground italic border-t border-foreground/10 pt-2">
              📌 {route.notes}
            </p>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {[{ n: 1, label: 'Elige asiento' }, { n: 2, label: 'Tus datos' }, { n: 3, label: 'Confirmar' }].map(({ n, label }, i) => (
            <div key={n} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2',
                  step > n ? 'bg-green-500 border-green-500 text-white'
                  : step === n ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted border-border text-muted-foreground'
                )}>
                  {step > n ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <span className={cn('text-xs font-bold hidden sm:block whitespace-nowrap',
                  step === n ? 'text-foreground' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={cn('flex-1 h-0.5 mx-2', step > n ? 'bg-green-500' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Selector de asientos ── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">Elige tu asiento</h2>
            <SeatSelector
              layout={layout}
              totalSeats={capacity}
              takenSeats={takenSeats}
              selectedSeat={selectedSeat}
              onSelect={setSelectedSeat}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!selectedSeat}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Continuar con asiento {selectedSeat ?? '—'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Datos del pasajero ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black">Tus datos</h2>
              <p className="text-sm text-muted-foreground">Asiento {selectedSeat} · {getCurrencySymbol(route.currency)}{route.price.toFixed(0)}</p>
            </div>

            <div className="space-y-3">
              <Field label="Nombre completo *">
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  className="w-full border-2 border-foreground rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Email — para recibir tu confirmación y ofertas de retorno">
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tucorreo@email.com"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Teléfono">
                <input value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+591 7XXXXXXX"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              <Field label="Documento (CI / Pasaporte)">
                <input value={form.document}
                  onChange={e => setForm(f => ({ ...f, document: e.target.value }))}
                  placeholder="Número de documento"
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </Field>

              {/* Extras */}
              <div className="grid grid-cols-2 gap-3">
                <Toggle active={form.hasPet}
                  onClick={() => setForm(f => ({ ...f, hasPet: !f.hasPet }))}>
                  🐾 Viajo con mascota
                </Toggle>
                <Toggle active={form.hasExtraLuggage}
                  onClick={() => setForm(f => ({ ...f, hasExtraLuggage: !f.hasExtraLuggage }))}>
                  🧳 Equipaje extra
                </Toggle>
              </div>

              <Field label="Comentarios al transportador">
                <textarea value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: subo en terminal norte, llevo silla de ruedas..."
                  rows={3}
                  className="w-full border-2 border-foreground/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background resize-none" />
              </Field>
            </div>

            {formError && (
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-sm text-destructive font-bold">{formError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 border-2 border-foreground rounded-xl py-4 font-bold text-sm hover:bg-muted transition-colors">
                ← Editar asiento
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || submitting}
                className="flex-[2] bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirmando...</>
                  : 'Confirmar reserva ✓'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ── Componentes helpers ──
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary border-b-4 border-foreground">
        <div className="container flex items-center py-4">
          <Link to="/wemove" className="text-2xl font-black text-primary-foreground">WeMove</Link>
        </div>
      </div>
      <main className="container px-4">{children}</main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        'border-2 rounded-xl py-3 px-4 text-sm font-bold text-left transition-all',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-foreground/40'
      )}>
      {active && '✓ '}{children}
    </button>
  );
}
