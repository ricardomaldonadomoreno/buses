// src/pages/WeMoveCartera.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { getCurrencySymbol } from '@/lib/currencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Wallet, ArrowLeft, AlertCircle, CheckCircle,
  Clock, Plus, MessageCircle, ArrowRight, Loader2,
  RefreshCw, TrendingUp, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPORT_WHATSAPP = '59172632220'; // ← cambia por tu número real

function feeLabel(seats: number): number {
  if (seats <= 4)  return 5;
  if (seats <= 10) return 10;
  if (seats <= 15) return 15;
  if (seats <= 20) return 20;
  return 30;
}

export default function WeMoveCartera() {
  const navigate        = useNavigate();
  const { user, loading: authLoading } = useWeMoveAuth();

  const [balance, setBalance]       = useState<number>(0);
  const [pending, setPending]       = useState<any[]>([]);
  const [history, setHistory]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/wemove/register');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      // Saldo y nombre
      const { data: prof } = await supabase
        .from('profiles')
        .select('wemove_balance, full_name')
        .eq('id', user.id)
        .maybeSingle();

      setBalance(prof?.wemove_balance ?? 0);
      setProfileName(prof?.full_name ?? '');

      // Viajes con deuda pendiente
      const { data: pendingRoutes } = await supabase
        .from('wemove_routes')
        .select(`
          id, fee_amount, fee_status, departure_time, trip_code,
          routes:route_id (
            origin:origin_location_id (name),
            destination:destination_location_id (name)
          ),
          transport_units:transport_unit_id (capacity)
        `)
        .eq('transporter_id', user.id)
        .eq('status', 'completed')
        .eq('fee_status', 'pending')
        .order('departure_time', { ascending: false });

      setPending(pendingRoutes ?? []);

      // Historial pagados
      const { data: paidRoutes } = await supabase
        .from('wemove_routes')
        .select(`
          id, fee_amount, fee_status, fee_paid_at, departure_time, trip_code,
          routes:route_id (
            origin:origin_location_id (name),
            destination:destination_location_id (name)
          )
        `)
        .eq('transporter_id', user.id)
        .eq('status', 'completed')
        .eq('fee_status', 'paid')
        .order('fee_paid_at', { ascending: false })
        .limit(20);

      setHistory(paidRoutes ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!user) return null;

  const totalDebt    = pending.reduce((sum, r) => sum + (r.fee_amount ?? 0), 0);
  const isBlocked    = pending.length > 0 && balance <= 0;
  const currSym      = 'Bs.'; // cartera siempre en moneda local

  const whatsappPagar = (route: any) => {
    const origin = route.routes?.origin?.name ?? '—';
    const dest   = route.routes?.destination?.name ?? '—';
    const fecha  = format(new Date(route.departure_time), "d 'de' MMMM yyyy", { locale: es });
    const msg    = encodeURIComponent(
      `Hola WeMove soporte, quiero pagar mi tarifa pendiente.\n` +
      `Viaje: ${origin} → ${dest}\n` +
      `Fecha: ${fecha}\n` +
      `Monto: ${currSym}${route.fee_amount ?? '—'}\n` +
      `Chofer: ${profileName}\n` +
      `Código: ${route.trip_code ?? route.id}`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, '_blank');
  };

  const whatsappRecargar = (monto: number) => {
    const msg = encodeURIComponent(
      `Hola WeMove, quiero recargar saldo a mi cartera.\n` +
      `Monto: ${currSym}${monto}\n` +
      `Chofer: ${profileName}`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-14 items-center gap-3">
          <Link to="/wemove/dashboard"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Wallet className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg font-semibold">
            Mi <span className="text-primary">Cartera</span>
          </span>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl py-6 space-y-5">

        {/* Alerta de bloqueo */}
        {isBlocked && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3">
            <Ban className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-700 text-sm">Cuenta bloqueada para nuevos viajes</p>
              <p className="text-xs text-red-600 mt-0.5">
                Tienes deudas pendientes con WeMove. Paga o recarga saldo para desbloquear.
              </p>
            </div>
          </div>
        )}

        {/* Saldo + deuda */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border-2 border-foreground/10 rounded-2xl p-5 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Saldo disponible</p>
            <p className={cn('text-4xl font-black leading-none',
              balance > 0 ? 'text-green-600' : 'text-muted-foreground')}>
              {currSym}{balance.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">créditos prepagados</p>
          </div>
          <div className={cn(
            'border-2 rounded-2xl p-5 space-y-1',
            totalDebt > 0 ? 'bg-red-50 border-red-200' : 'bg-card border-foreground/10'
          )}>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Deuda pendiente</p>
            <p className={cn('text-4xl font-black leading-none',
              totalDebt > 0 ? 'text-red-600' : 'text-green-600')}>
              {currSym}{totalDebt.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">{pending.length} viaje{pending.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Recargar saldo */}
        <div className="bg-card border-2 border-foreground/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="font-black text-sm">Recargar saldo</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Prepaga créditos y tus viajes se descuentan automáticamente. Sin sorpresas.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[20, 50, 100, 200].map(monto => (
              <button key={monto}
                onClick={() => whatsappRecargar(monto)}
                className="border-2 border-primary/30 text-primary font-black text-sm py-3 rounded-xl hover:bg-primary/10 transition-colors">
                {currSym}{monto}
              </button>
            ))}
          </div>
          <button
            onClick={() => whatsappRecargar(0)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-black text-sm py-3 rounded-xl hover:bg-green-600 transition-colors">
            <MessageCircle className="h-4 w-4" />
            Otro monto — contactar soporte
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            Coordinamos el pago por transferencia o QR. Saldo se acredita en minutos.
          </p>
        </div>

        {/* Deudas pendientes */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="font-black text-sm">Viajes con pago pendiente</p>
            </div>
            {pending.map(route => {
              const origin = route.routes?.origin?.name ?? '—';
              const dest   = route.routes?.destination?.name ?? '—';
              const fecha  = format(new Date(route.departure_time), "d MMM yyyy · HH:mm", { locale: es });
              const seats  = route.transport_units?.capacity ?? 4;
              return (
                <div key={route.id}
                  className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span>{origin}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{dest}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{fecha}</p>
                      {route.trip_code && (
                        <p className="text-xs text-primary font-bold mt-0.5">{route.trip_code}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Tarifa WeMove</p>
                      <p className="text-2xl font-black text-red-600">
                        {currSym}{route.fee_amount ?? feeLabel(seats)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => whatsappPagar(route)}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-black text-sm py-2.5 rounded-xl hover:bg-green-600 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    Pagar por WhatsApp
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Historial de pagos */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="font-black text-sm">Historial de pagos</p>
            </div>
            <div className="bg-card border-2 border-foreground/10 rounded-2xl overflow-hidden divide-y divide-border/40">
              {history.map(route => {
                const origin = route.routes?.origin?.name ?? '—';
                const dest   = route.routes?.destination?.name ?? '—';
                const fecha  = format(new Date(route.departure_time), "d MMM yyyy", { locale: es });
                return (
                  <div key={route.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <span>{origin}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{dest}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{fecha}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">
                        -{currSym}{route.fee_amount}
                      </p>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">
                        Pagado
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pending.length === 0 && history.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Wallet className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="font-bold text-muted-foreground">Sin movimientos aún</p>
            <p className="text-xs text-muted-foreground">
              Aquí verás tus tarifas WeMove cuando completes viajes.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
