// src/pages/WeMoveBooking.tsx
// Página completa de reserva con selector de asientos y formulario
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { SeatSelector } from '@/components/wemove/SeatSelector';
import { WeMoveHeader } from '@/components/wemove/WeMoveHeader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Calendar, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Route {
  id: string; price: number; available_seats: number; departure_time: string;
  transport_unit: { type: string; capacity: number };
  transporter: { display_name: string; phone_full: string | null; rating: number | null };
  route: { origin: { name: string }; destination: { name: string } };
}

interface BookingForm {
  name: string; email: string; phone: string; document: string;
  hasPet: boolean; hasExtraLuggage: boolean; notes: string;
}

export default function WeMoveBooking() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<1 | 2 | 3>(1);  // 1=asiento, 2=datos, 3=confirmación
  const [route, setRoute] = useState<Route | null>(null);
  const [takenSeats, setTakenSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ id: string; boarding_code: string; payment_deadline: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', phone: '', document: '',
    hasPet: false, hasExtraLuggage: false, notes: ''
  });

  // Cargar ruta y asientos ocupados
  useEffect(() => {
    if (!routeId) return;
    const load = async () => {
      // Ruta
      const { data: r } = await supabase
        .from('wemove_routes')
        .select(`
          id, price, available_seats, departure_time,
          transport_unit:transport_units(type, capacity),
          transporter:profiles!wemove_routes_transporter_id_fkey(display_name, phone_full, rating),
          route:routes(
            origin:locations!routes_origin_location_id_fkey(name),
            destination:locations!routes_destination_location_id_fkey(name)
          )
        `)
        .eq('id', routeId)
        .eq('status', 'active')
        .single();
      if (!r) { setError('Ruta no disponible'); setLoading(false); return; }
      setRoute(r as any);

      // Asientos ocupados
      const { data: bookings } = await supabase
        .from('wemove_bookings')
        .select('seat_number')
        .eq('route_id', routeId)
        .in('status', ['confirmed', 'paid']);
      setTakenSeats((bookings ?? []).map(b => b.seat_number));
      setLoading(false);
    };
    load();
  }, [routeId]);

  const handleSeatSelect = (n: number) => setSelectedSeat(n === 0 ? null : n);

  const handleSubmit = async () => {
    if (!route || !selectedSeat || !form.name) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('wemove_bookings')
        .insert({
          route_id:           route.id,
          passenger_name:     form.name,
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
      setError(e?.message ?? 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );

  if (error && !route) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-destructive font-bold">{error}</p>
        <Link to="/wemove" className="text-sm text-primary underline">Volver a WeMove</Link>
      </div>
    </div>
  );

  const capacity = route?.transport_unit?.capacity ?? 20;
  const origin = route?.route?.origin?.name ?? '';
  const destination = route?.route?.destination?.name ?? '';
  const departure = route ? format(new Date(route.departure_time), "d 'de' MMMM · HH:mm", { locale: es }) : '';

  // ── STEP 3: ÉXITO ──
  if (step === 3 && bookingResult) {
    const deadline = new Date(bookingResult.payment_deadline);
    const phone = route?.transporter?.phone_full;
    const transporterName = route?.transporter?.display_name;
    const whatsappMsg = encodeURIComponent(
      `Hola ${transporterName}, reservé el asiento ${selectedSeat} (código ${bookingResult.boarding_code}) en el viaje ${origin} → ${destination} del ${departure}. Quisiera coordinar el pago.`
    );
    const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g,'')}?text=${whatsappMsg}` : null;

    return (
      <div className="min-h-screen bg-background">
        <WeMoveHeader />
        <main className="container max-w-lg py-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black">¡Reserva confirmada!</h1>
            <p className="text-muted-foreground mt-1">{origin} → {destination} · {departure}</p>
          </div>

          {/* Código de embarque */}
          <div className="border-4 border-foreground rounded-2xl p-6 text-center mb-6 bg-primary/5">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Tu código de embarque</p>
            <p className="text-6xl font-black tracking-[0.3em] text-primary">{bookingResult.boarding_code}</p>
            <p className="text-sm text-muted-foreground mt-2">Asiento <span className="font-black text-foreground">{selectedSeat}</span></p>
          </div>

          {/* Deadline pago */}
          <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Clock className="h-4 w-4 shrink-0" />
              <p className="font-bold text-sm">Coordina tu pago antes de:</p>
            </div>
            <p className="text-amber-900 font-black text-lg">
              {format(deadline, "d 'de' MMMM · HH:mm", { locale: es })}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Si no se confirma el pago, tu asiento se liberará automáticamente.
            </p>
          </div>

          {/* WhatsApp */}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 text-white font-black text-sm px-6 py-4 rounded-xl hover:bg-green-600 transition-colors mb-4 w-full">
              💬 Contactar al transportador por WhatsApp
            </a>
          )}

          <Link to="/wemove"
            className="flex items-center justify-center gap-2 border-2 border-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-muted transition-colors w-full">
            <ArrowLeft className="h-4 w-4" /> Volver a WeMove
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WeMoveHeader />
      <main className="container max-w-lg py-8">

        {/* Breadcrumb del viaje */}
        <div className="mb-6">
          <Link to="/wemove" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold">
            <MapPin className="h-4 w-4 text-primary" />{origin}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <MapPin className="h-4 w-4 text-destructive" />{destination}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{departure}</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Bs. {route?.price.toFixed(0)} por asiento</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(['Elige asiento', 'Tus datos', 'Confirmar'] as const).map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all',
                step > i + 1 ? 'bg-green-500 border-green-500 text-white'
                  : step === i + 1 ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted border-border text-muted-foreground'
              )}>
                {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-bold', step === i + 1 ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < 2 && <div className={cn('flex-1 h-0.5', step > i + 1 ? 'bg-green-500' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Selector de asientos ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black mb-1">Elige tu asiento</h2>
              <p className="text-sm text-muted-foreground">
                {takenSeats.length} ocupados · {capacity - takenSeats.length} disponibles
              </p>
            </div>
            <SeatSelector
              totalSeats={capacity}
              takenSeats={takenSeats}
              selectedSeat={selectedSeat}
              onSelect={handleSeatSelect}
              vehicleType={route?.transport_unit?.type}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!selectedSeat}
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
              Continuar con asiento {selectedSeat} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Datos del pasajero ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black mb-1">Tus datos</h2>
              <p className="text-sm text-muted-foreground">Asiento {selectedSeat} · Bs. {route?.price.toFixed(0)}</p>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Nombre completo *
                </label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Tu nombre"
                  className="w-full border-2 border-foreground rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Email (para recibir confirmación)
                </label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="tucorreo@email.com"
                  className="w-full border-2 border-foreground/40 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Teléfono
                </label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  placeholder="+591 7XXXXXXX"
                  className="w-full border-2 border-foreground/40 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </div>

              {/* Documento */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Número de documento
                </label>
                <input value={form.document} onChange={e => setForm(f => ({...f, document: e.target.value}))}
                  placeholder="CI / Pasaporte"
                  className="w-full border-2 border-foreground/40 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background" />
              </div>

              {/* Extras — toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setForm(f => ({...f, hasPet: !f.hasPet}))}
                  className={cn('border-2 rounded-xl py-3 px-4 text-sm font-bold text-left transition-all',
                    form.hasPet ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/40')}>
                  🐾 {form.hasPet ? '✓ ' : ''}Con mascota
                </button>
                <button onClick={() => setForm(f => ({...f, hasExtraLuggage: !f.hasExtraLuggage}))}
                  className={cn('border-2 rounded-xl py-3 px-4 text-sm font-bold text-left transition-all',
                    form.hasExtraLuggage ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-foreground/40')}>
                  🧳 {form.hasExtraLuggage ? '✓ ' : ''}Equipaje extra
                </button>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Comentarios adicionales
                </label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Ej: Necesito subir en otro punto de la ruta..."
                  rows={3}
                  className="w-full border-2 border-foreground/40 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-primary bg-background resize-none" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-bold">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 border-2 border-foreground rounded-xl py-4 font-bold text-sm hover:bg-muted transition-colors">
                ← Editar asiento
              </button>
              <button onClick={handleSubmit}
                disabled={!form.name || submitting}
                className="flex-[2] bg-primary text-primary-foreground font-black py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Confirmando...</>
                  : <>Confirmar reserva ✓</>
                }
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
