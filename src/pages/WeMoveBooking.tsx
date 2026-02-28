import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  ArrowLeft, ArrowRight, Calendar, Users, MapPin,
  PawPrint, Luggage, Wind, Wifi, Home, Loader2,
  CheckCircle2, AlertCircle, User, Phone, CreditCard, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────
interface RouteSeat {
  id: string; seat_label: string; seat_row: number;
  seat_col: number; seat_type: string; status: string;
}
interface RouteDetail {
  id: string; departure_time: string; available_seats: number;
  price: number; currency: string; status: string;
  accepts_pets: boolean; accepts_luggage: boolean;
  has_ac: boolean; has_wifi: boolean; door_to_door: boolean;
  description: string | null; notes: string | null; vehicle_type: string | null;
  route: { origin: { name: string }; destination: { name: string } } | null;
  transporter: { full_name: string | null; rating: number | null } | null;
  transport_unit: { type: string; capacity: number } | null;
}

// ── Hooks ────────────────────────────────────────────────────
function useRouteDetail(routeId?: string) {
  return useQuery({
    queryKey: ['route-detail', routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wemove_routes')
        .select(`
          *,
          route:route_id (
            origin:origin_location_id (name),
            destination:destination_location_id (name)
          ),
          transporter:transporter_id (full_name, rating),
          transport_unit:transport_unit_id (type, capacity)
        `)
        .eq('id', routeId!)
        .single();
      if (error) throw error;
      return data as unknown as RouteDetail;
    },
    enabled: !!routeId,
  });
}

function useRouteSeats(routeId?: string) {
  return useQuery({
    queryKey: ['route-seats', routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_seats')
        .select('*')
        .eq('route_id', routeId!)
        .order('seat_row').order('seat_col');
      if (error) throw error;
      return data as RouteSeat[];
    },
    enabled: !!routeId,
  });
}

function useCreateBooking() {
  return useMutation({
    mutationFn: async (booking: {
      route_id: string; seat_label: string;
      passenger_name: string; passenger_email: string;
      passenger_phone: string; passenger_doc: string;
      brings_pet: boolean; pet_description: string;
      extra_luggage: boolean; luggage_details: string;
      special_notes: string;
    }) => {
      // Mark seat as reserved optimistically
      await supabase.from('route_seats')
        .update({ status: 'reserved' })
        .eq('route_id', booking.route_id)
        .eq('seat_label', booking.seat_label);

      const { data, error } = await supabase
        .from('wemove_bookings')
        .insert({
          route_id:       booking.route_id,
          passenger_name:  booking.passenger_name,
          passenger_email: booking.passenger_email,
          passenger_phone: booking.passenger_phone || null,
          passenger_doc:   booking.passenger_doc || null,
          seat_label:      booking.seat_label,
          brings_pet:      booking.brings_pet,
          pet_description: booking.pet_description || null,
          extra_luggage:   booking.extra_luggage,
          luggage_details: booking.luggage_details || null,
          special_notes:   booking.special_notes || null,
          status:          'pending',
          payment_status:  'unpaid',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ── Seat grid ────────────────────────────────────────────────
function SeatMap({ seats, selected, onSelect }: {
  seats: RouteSeat[]; selected: string | null;
  onSelect: (label: string) => void;
}) {
  if (seats.length === 0) return null;

  const rows: Record<number, RouteSeat[]> = {};
  seats.forEach(s => {
    if (!rows[s.seat_row]) rows[s.seat_row] = [];
    rows[s.seat_row].push(s);
  });

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-primary/20 border border-primary/40 inline-block" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-primary border border-primary inline-block" /> Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-muted border border-border inline-block" /> Ocupado
        </span>
      </div>

      {/* Grid */}
      <div className="bg-muted/20 rounded-2xl p-5 overflow-x-auto">
        {/* Driver row label */}
        <div className="text-xs text-center text-muted-foreground mb-3 font-medium">⬆ Frente del vehículo</div>
        <div className="space-y-2 w-fit mx-auto">
          {Object.entries(rows)
            .sort(([a], [b]) => +a - +b)
            .map(([rowNum, rowSeats]) => (
              <div key={rowNum} className="flex gap-2 items-center justify-center">
                <span className="text-xs text-muted-foreground/50 w-4 text-right shrink-0">{rowNum}</span>
                {rowSeats.sort((a, b) => a.seat_col - b.seat_col).map(seat => {
                  const isAvailable = seat.status === 'available';
                  const isSelected  = selected === seat.seat_label;

                  return (
                    <button
                      key={seat.seat_label}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && onSelect(seat.seat_label)}
                      title={seat.seat_label}
                      className={cn(
                        'w-9 h-9 rounded-xl text-xs font-bold transition-all duration-150 border-2',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md'
                          : isAvailable
                            ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/25 hover:border-primary/60 hover:scale-105'
                            : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
                      )}
                    >
                      {seat.seat_label}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
type Step = 'seat' | 'info' | 'confirm' | 'success';

export default function WeMoveBooking() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate    = useNavigate();

  const { data: route,  isLoading: routeLoading  } = useRouteDetail(routeId);
  const { data: seats = [], refetch: refetchSeats } = useRouteSeats(routeId);
  const createBooking = useCreateBooking();

  const [step, setStep]               = useState<Step>('seat');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  // Passenger info
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [doc, setDoc]           = useState('');
  const [bringsPet, setBringsPet]       = useState(false);
  const [petDesc, setPetDesc]           = useState('');
  const [extraLuggage, setExtraLuggage] = useState(false);
  const [luggageDetails, setLuggageDetails] = useState('');
  const [notes, setNotes]       = useState('');

  const handleSubmit = async () => {
    if (!routeId || !selectedSeat) return;
    try {
      await createBooking.mutateAsync({
        route_id: routeId, seat_label: selectedSeat,
        passenger_name: name, passenger_email: email,
        passenger_phone: phone, passenger_doc: doc,
        brings_pet: bringsPet, pet_description: petDesc,
        extra_luggage: extraLuggage, luggage_details: luggageDetails,
        special_notes: notes,
      });
      await refetchSeats();
      setStep('success');
    } catch (err) {
      console.error(err);
    }
  };

  const vehicleEmoji: Record<string, string> = {
    bus:'🚌', microbus:'🚐', minibus:'🚐', van:'🚐',
    sedan:'🚗', suv:'🚙', boat:'⛵', plane:'✈️',
  };

  if (routeLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!route) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Viaje no encontrado</p>
      <Link to="/wemove" className="text-primary underline text-sm">Volver a WeMove</Link>
    </div>
  );

  const dep     = new Date(route.departure_time);
  const emoji   = vehicleEmoji[route.transport_unit?.type ?? ''] ?? '🚌';
  const origin  = route.route?.origin?.name  ?? '—';
  const dest    = route.route?.destination?.name ?? '—';
  const currency = route.currency ?? 'BOB';

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="WeMove" className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity" />
            <span className="font-serif text-lg font-semibold hidden sm:block">
              We<span className="text-primary">Move</span>
            </span>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-xl">

        {/* Back link */}
        <Link to="/wemove"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver a resultados
        </Link>

        {/* Route summary card */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-semibold text-base">
                <span className="truncate">{origin}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{dest}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(dep, "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {route.available_seats} asientos disponibles
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-primary">{currency} {route.price}</p>
              <p className="text-xs text-muted-foreground">por asiento</p>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/40">
            {route.accepts_pets  && <Chip icon={PawPrint} label="Mascotas OK" />}
            {route.accepts_luggage && <Chip icon={Luggage}  label="Equipaje" />}
            {route.has_ac        && <Chip icon={Wind}      label="A/C" />}
            {route.has_wifi      && <Chip icon={Wifi}      label="WiFi" />}
            {route.door_to_door  && <Chip icon={Home}      label="Puerta a puerta" />}
          </div>

          {/* Transporter */}
          {route.transporter?.full_name && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {route.transporter.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{route.transporter.full_name}</p>
                {route.transporter.rating && (
                  <p className="text-xs text-muted-foreground">⭐ {Number(route.transporter.rating).toFixed(1)}</p>
                )}
              </div>
            </div>
          )}

          {route.description && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40 italic">
              {route.description}
            </p>
          )}
        </div>

        {/* STEP INDICATORS */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-6">
            {(['seat', 'info', 'confirm'] as Step[]).map((s, i) => {
              const steps: Step[] = ['seat', 'info', 'confirm'];
              const idx    = steps.indexOf(step);
              const sIdx   = steps.indexOf(s);
              const labels = ['Elige asiento', 'Tus datos', 'Confirmar'];
              return (
                <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className={cn(
                    'flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
                    sIdx <= idx ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      sIdx < idx  ? 'bg-primary text-primary-foreground' :
                      sIdx === idx ? 'bg-primary text-primary-foreground' :
                                    'bg-muted text-muted-foreground'
                    )}>
                      {sIdx < idx ? '✓' : i + 1}
                    </span>
                    <span className="hidden sm:inline">{labels[i]}</span>
                  </div>
                  {i < 2 && <div className={cn('flex-1 h-px', sIdx < idx ? 'bg-primary' : 'bg-border')} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STEP 1: SEAT ── */}
        {step === 'seat' && (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border/60 p-5">
              <h2 className="font-serif text-lg font-semibold mb-4">Elige tu asiento</h2>
              {seats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">El transportador no ha definido un mapa de asientos.</p>
                  <p className="text-xs mt-1">Puedes continuar sin seleccionar asiento específico.</p>
                  <button
                    onClick={() => { setSelectedSeat('Libre'); setStep('info'); }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Continuar →
                  </button>
                </div>
              ) : (
                <>
                  <SeatMap seats={seats} selected={selectedSeat} onSelect={setSelectedSeat} />
                  {selectedSeat && (
                    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        Asiento seleccionado: <span className="font-bold text-primary">{selectedSeat}</span>
                      </p>
                      <button
                        onClick={() => setStep('info')}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                        Continuar →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: PASSENGER INFO ── */}
        {step === 'info' && (
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="font-serif text-base font-semibold">Tus datos de pasajero</h2>
            </div>
            <div className="p-5 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BField label="Nombre completo *">
                  <Input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Juan Pérez" className="rounded-xl border-border/60" required />
                </BField>
                <BField label="Correo electrónico *">
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="juan@ejemplo.com" className="rounded-xl border-border/60" required />
                </BField>
                <BField label="Teléfono">
                  <Input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+591 70000000" className="rounded-xl border-border/60" />
                </BField>
                <BField label="N° de documento">
                  <Input value={doc} onChange={e => setDoc(e.target.value)}
                    placeholder="CI / Pasaporte" className="rounded-xl border-border/60" />
                </BField>
              </div>

              {/* Pet option */}
              {route.accepts_pets && (
                <div className="space-y-2">
                  <Toggle icon={PawPrint} label="Llevaré una mascota"
                    value={bringsPet} onChange={setBringsPet} />
                  {bringsPet && (
                    <Input value={petDesc} onChange={e => setPetDesc(e.target.value)}
                      placeholder="Describe tu mascota: raza, tamaño, etc."
                      className="rounded-xl border-border/60 text-sm" />
                  )}
                </div>
              )}

              {/* Luggage */}
              {route.accepts_luggage && (
                <div className="space-y-2">
                  <Toggle icon={Luggage} label="Equipaje extra o bultos grandes"
                    value={extraLuggage} onChange={setExtraLuggage} />
                  {extraLuggage && (
                    <Input value={luggageDetails} onChange={e => setLuggageDetails(e.target.value)}
                      placeholder="Describe el equipaje: cantidad, tamaño"
                      className="rounded-xl border-border/60 text-sm" />
                  )}
                </div>
              )}

              <BField label="Notas especiales (opcional)">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="¿Algo que el transportador deba saber?"
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </BField>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('seat')}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  ← Atrás
                </button>
                <button
                  onClick={() => {
                    if (!name.trim() || !email.trim()) return;
                    setStep('confirm');
                  }}
                  disabled={!name.trim() || !email.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  Revisar reserva →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-3">
              <h2 className="font-serif text-lg font-semibold">Resumen de tu reserva</h2>

              <div className="space-y-2 text-sm">
                <Row label="Viaje"    value={`${origin} → ${dest}`} />
                <Row label="Fecha"    value={format(dep, "d 'de' MMMM yyyy · HH:mm", { locale: es })} />
                <Row label="Asiento"  value={selectedSeat ?? '—'} highlight />
                <Row label="Precio"   value={`${currency} ${route.price}`} highlight />
                <div className="border-t border-border/40 pt-2 mt-2">
                  <Row label="Pasajero" value={name} />
                  <Row label="Email"    value={email} />
                  {phone && <Row label="Teléfono" value={phone} />}
                  {doc   && <Row label="Documento" value={doc} />}
                  {bringsPet && <Row label="Mascota" value={petDesc || 'Sí'} />}
                  {extraLuggage && <Row label="Equipaje extra" value={luggageDetails || 'Sí'} />}
                  {notes && <Row label="Notas" value={notes} />}
                </div>
              </div>
            </div>

            {/* Payment note */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <CreditCard className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Pago al momento del viaje</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  El transportador confirmará tu reserva. El pago se coordina directamente con él antes del viaje.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('info')}
                className="flex-1 py-3.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                ← Editar datos
              </button>
              <button onClick={handleSubmit} disabled={createBooking.isPending}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {createBooking.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
                  : 'Confirmar reserva ✓'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="bg-card rounded-2xl border border-border/60 p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground">¡Reserva enviada!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Tu solicitud fue enviada al transportador. Recibirás confirmación en <strong>{email}</strong>.
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4 text-sm text-left space-y-1.5">
              <p><span className="text-muted-foreground">Viaje:</span> <strong>{origin} → {dest}</strong></p>
              <p><span className="text-muted-foreground">Fecha:</span> {format(dep, "d MMM · HH:mm", { locale: es })}</p>
              <p><span className="text-muted-foreground">Asiento:</span> <strong className="text-primary">{selectedSeat}</strong></p>
              <p><span className="text-muted-foreground">Precio:</span> <strong>{currency} {route.price}</strong></p>
            </div>
            <p className="text-xs text-muted-foreground">
              El pago se coordina con el transportador antes del viaje.
            </p>
            <Link to="/wemove"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Volver a WeMove
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Mini helpers ─────────────────────────────────────────────
function Chip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground/60 bg-muted px-2 py-0.5 rounded-full">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function Toggle({ icon: Icon, label, value, onChange }: {
  icon: React.ElementType; label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-2.5 w-full p-3 rounded-xl border text-left transition-all text-sm font-medium',
        value ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 text-foreground hover:bg-muted/40'
      )}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <span className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
        value ? 'border-primary bg-primary' : 'border-border')}>
        {value && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
      </span>
    </button>
  );
}

function BField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={cn('text-right', highlight ? 'font-bold text-primary' : 'text-foreground')}>{value}</span>
    </div>
  );
}
