// Reemplaza el paso 3 (Confirmar) en src/pages/WeMoveBooking.tsx
// Este es el componente de la pantalla de éxito post-reserva

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, MessageCircle, Phone } from 'lucide-react';

interface PaymentCountdownProps {
  paymentDeadline: string;        // ISO string
  transporterPhone?: string;
  transporterName?: string;
  routeId: string;
  bookingId: string;
}

export function PaymentCountdown({
  paymentDeadline, transporterPhone, transporterName, routeId, bookingId
}: PaymentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const update = () => {
      const diff = new Date(paymentDeadline).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft('00:00:00'); return; }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      setUrgency(h < 1 ? 'critical' : h < 2 ? 'warning' : 'normal');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [paymentDeadline]);

  const whatsappMsg = encodeURIComponent(
    `Hola ${transporterName ?? 'transportador'}, reservé un asiento (ID: ${bookingId.slice(0,8)}). Quisiera coordinar el pago de mi reserva.`
  );
  const whatsappUrl = transporterPhone
    ? `https://wa.me/${transporterPhone.replace(/\D/g,'')}?text=${whatsappMsg}`
    : null;

  if (isExpired) {
    return (
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="font-bold text-sm">Tu reserva ha expirado</p>
        </div>
        <p className="text-xs text-red-600 leading-relaxed">
          El plazo para coordinar el pago venció. Tu asiento fue liberado automáticamente.
          Si aún deseas viajar, contáctate con el transportador — si hay asientos disponibles puede reagendarte.
        </p>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors w-fit">
            <MessageCircle className="h-4 w-4" />
            Contactar al transportador
          </a>
        )}
      </div>
    );
  }

  const bgColor = urgency === 'critical' ? 'bg-red-50 border-red-300'
    : urgency === 'warning' ? 'bg-amber-50 border-amber-300'
    : 'bg-blue-50 border-blue-300';

  const textColor = urgency === 'critical' ? 'text-red-700'
    : urgency === 'warning' ? 'text-amber-700'
    : 'text-blue-700';

  const timerColor = urgency === 'critical' ? 'text-red-600'
    : urgency === 'warning' ? 'text-amber-600'
    : 'text-blue-600';

  return (
    <div className={`rounded-2xl border-2 ${bgColor} p-5 space-y-4`}>
      {/* Header */}
      <div className={`flex items-center gap-2 ${textColor}`}>
        <Clock className="h-5 w-5 shrink-0" />
        <p className="font-bold text-sm">Coordina tu pago antes de que expire tu reserva</p>
      </div>

      {/* Countdown */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Tiempo restante</p>
        <span className={`font-black text-4xl tabular-nums tracking-widest ${timerColor}`}>
          {timeLeft}
        </span>
      </div>

      {/* Instrucciones */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
          <p>Contáctate con el transportador para coordinar el pago (efectivo, transferencia, QR)</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
          <p>El transportador confirmará tu pago desde su panel — recibirás una notificación</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
          <p>Si el plazo vence sin confirmación, tu asiento se libera automáticamente</p>
        </div>
      </div>

      {/* CTA WhatsApp */}
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-xl hover:bg-green-600 transition-colors">
          <MessageCircle className="h-4 w-4" />
          Escribir al transportador por WhatsApp
        </a>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// PANEL DEL CHOFER: lista de reservas con botón "Marcar pagado"
// Agregar en src/pages/WeMoveDashboard.tsx o nueva página
// ══════════════════════════════════════════════════════════

import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface Booking {
  id: string;
  passenger_name: string;
  passenger_email: string;
  seat_label: string;
  status: string;
  payment_deadline: string;
  paid_at: string | null;
  commission_amount: number | null;
  commission_triggered: boolean;
  departure_time: string;
  price: number;
  is_overdue: boolean;
  hours_until_deadline: number;
}

interface BookingsPanelProps {
  routeId: string;
  userId: string;
  origin: string;
  destination: string;
}

export function TransporterBookingsPanel({ routeId, userId, origin, destination }: BookingsPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('vw_transporter_bookings')
      .select('*')
      .eq('route_id', routeId)
      .order('created_at', { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [routeId]);

  const markAsPaid = async (bookingId: string) => {
    setMarking(bookingId);
    try {
      const { data, error } = await supabase.rpc('mark_booking_paid', {
        p_booking_id: bookingId,
        p_transporter_user_id: userId,
      });
      if (error) throw error;
      await fetchBookings(); // refrescar
    } finally {
      setMarking(null);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    confirmed:  { label: 'Pendiente pago', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    paid:       { label: 'Pagado ✓',       color: 'bg-green-100 text-green-800 border-green-300' },
    expired:    { label: 'Expirado',       color: 'bg-red-100 text-red-700 border-red-300' },
    cancelled:  { label: 'Cancelado',      color: 'bg-gray-100 text-gray-600 border-gray-300' },
  };

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Cargando pasajeros...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-base">{origin} → {destination}</h3>
        <span className="text-xs text-muted-foreground">
          {bookings.filter(b => b.status === 'paid').length} pagados / {bookings.length} reservas
        </span>
      </div>

      {bookings.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No hay reservas aún</p>
      )}

      {bookings.map(booking => {
        const cfg = statusConfig[booking.status] ?? { label: booking.status, color: 'bg-gray-100 text-gray-600' };
        const deadlinePast = isPast(new Date(booking.payment_deadline));
        const hoursLeft = Math.max(0, booking.hours_until_deadline ?? 0);

        return (
          <div key={booking.id}
            className={`border-2 rounded-xl p-4 space-y-3 ${booking.is_overdue ? 'border-red-300 bg-red-50/30' : 'border-border bg-card'}`}>
            
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm">{booking.passenger_name}</p>
                <p className="text-xs text-muted-foreground">{booking.passenger_email}</p>
                <p className="text-xs text-muted-foreground">Asiento: <span className="font-bold text-foreground">{booking.seat_label}</span></p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.color} shrink-0`}>
                {cfg.label}
              </span>
            </div>

            {/* Precio y comisión */}
            <div className="flex gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">Precio</p>
                <p className="font-black text-base text-primary">Bs. {booking.price.toFixed(0)}</p>
              </div>
              {booking.commission_triggered && booking.commission_amount && (
                <div>
                  <p className="text-muted-foreground">Comisión WeMove</p>
                  <p className="font-bold text-red-500">- Bs. {booking.commission_amount.toFixed(2)}</p>
                </div>
              )}
              {booking.commission_triggered && booking.commission_amount && (
                <div>
                  <p className="text-muted-foreground">Tu ganancia</p>
                  <p className="font-bold text-green-600">Bs. {(booking.price - booking.commission_amount).toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Deadline */}
            {booking.status === 'confirmed' && (
              <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${deadlinePast ? 'bg-red-100 text-red-700' : hoursLeft < 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {deadlinePast
                  ? 'Plazo vencido — el asiento se liberará automáticamente'
                  : `Plazo de pago: ${format(new Date(booking.payment_deadline), "d MMM · HH:mm", { locale: es })} (${hoursLeft.toFixed(0)}h restantes)`
                }
              </div>
            )}

            {/* Acción: marcar pagado */}
            {booking.status === 'confirmed' && (
              <button
                onClick={() => markAsPaid(booking.id)}
                disabled={marking === booking.id}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                {marking === booking.id
                  ? 'Procesando...'
                  : <><CheckCircle className="h-4 w-4" /> Confirmar pago recibido</>
                }
              </button>
            )}

            {booking.status === 'paid' && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5" />
                Pago confirmado el {format(new Date(booking.paid_at!), "d MMM · HH:mm", { locale: es })}
                {booking.commission_triggered && ' · Comisión registrada ✓'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
