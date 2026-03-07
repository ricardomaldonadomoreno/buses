// src/pages/WeMoveCartera.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Wallet, ArrowLeft, AlertCircle, CheckCircle,
  MessageCircle, ArrowRight, Loader2, TrendingUp,
  Ban, Ticket, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPORT_WHATSAPP = '59172632220';
const HOTMART_CHECKOUT = 'https://pay.hotmart.com/XXXXXXXX'; // ← pega aquí tu enlace de Hotmart

export default function WeMoveCartera() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useWeMoveAuth();

  const [credits, setCredits]         = useState<number>(0);
  const [history, setHistory]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/wemove/register');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      // Créditos y nombre
      const { data: prof } = await supabase
        .from('profiles')
        .select('wemove_credits, full_name')
        .eq('id', user.id)
        .maybeSingle();

      setCredits(prof?.wemove_credits ?? 0);
      setProfileName(prof?.full_name ?? '');

      // Historial de viajes completados
      const { data: completedRoutes } = await supabase
        .from('wemove_routes')
        .select(`
          id, departure_time, trip_code,
          routes:route_id (
            origin:origin_location_id (name),
            destination:destination_location_id (name)
          )
        `)
        .eq('transporter_id', user.id)
        .eq('status', 'completed')
        .order('departure_time', { ascending: false })
        .limit(20);

      setHistory(completedRoutes ?? []);
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

  const isBlocked = credits <= 0;

  const whatsappSoporte = () => {
    const msg = encodeURIComponent(
      `Hola WeMove soporte, necesito ayuda con mi cartera.\n` +
      `Chofer: ${profileName}\n` +
      `Créditos actuales: ${credits}`
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
              <p className="font-black text-red-700 text-sm">No puedes publicar nuevos viajes</p>
              <p className="text-xs text-red-600 mt-0.5">
                Se te agotaron los créditos. Recarga para seguir usando WeMove.
              </p>
            </div>
          </div>
        )}

        {/* Saldo de créditos */}
        <div className="bg-card border-2 border-foreground/10 rounded-2xl p-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Créditos disponibles
          </p>
          <div className="flex items-end gap-3">
            <p className={cn('text-6xl font-black leading-none',
              credits > 3 ? 'text-green-600' :
              credits > 0 ? 'text-amber-500' : 'text-red-500')}>
              {credits}
            </p>
            <div className="pb-1">
              <p className="text-sm font-bold text-muted-foreground">viajes disponibles</p>
              <p className="text-xs text-muted-foreground">1 crédito = 1 viaje completado</p>
            </div>
          </div>

          {/* Barra visual */}
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', 
                credits > 3 ? 'bg-green-500' :
                credits > 0 ? 'bg-amber-400' : 'bg-red-400')}
              style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
            />
          </div>

          {/* Info del modelo */}
          <div className="bg-muted/40 rounded-xl p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Cada vez que completas un viaje, se descuenta 1 crédito automáticamente. 
              Al llegar a 0, no podrás publicar nuevos viajes hasta recargar.
              Empezaste con <span className="font-bold">4 créditos gratis</span>.
            </p>
          </div>
        </div>

        {/* Recargar créditos */}
        <div className="bg-card border-2 border-foreground/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="font-black text-sm">Recargar créditos</p>
          </div>

          <p className="text-xs text-muted-foreground">
            El pago se procesa de forma segura a través de <span className="font-bold">Hotmart</span>. 
            Aceptamos tarjetas, transferencias y más métodos según tu país.
            Los créditos se acreditan automáticamente después del pago.
          </p>

          {/* Paquete principal $4 = 4 viajes */}
          <a
            href={HOTMART_CHECKOUT}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-primary text-primary-foreground px-5 py-4 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <div>
              <p className="font-black text-base">4 créditos — $4 USD</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">
                1 crédito por viaje · pago seguro vía Hotmart
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black">$4</p>
              <p className="text-[10px] text-primary-foreground/70">USD</p>
            </div>
          </a>

          <p className="text-[10px] text-muted-foreground text-center">
            ¿Necesitas más créditos o un plan personalizado? Contáctanos por WhatsApp.
          </p>

          <button
            onClick={whatsappSoporte}
            className="w-full flex items-center justify-center gap-2 border-2 border-green-400 text-green-700 font-bold text-sm py-3 rounded-xl hover:bg-green-50 transition-colors">
            <MessageCircle className="h-4 w-4" />
            Contactar soporte por WhatsApp
          </button>
        </div>

        {/* Historial de viajes completados */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="font-black text-sm">Viajes completados</p>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                {history.length}
              </span>
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
                      <p className="text-xs text-muted-foreground">
                        {fecha}
                        {route.trip_code && ` · ${route.trip_code}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-red-500">-1 crédito</p>
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">
                        Completado
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {history.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <Ticket className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="font-bold text-muted-foreground">Sin viajes completados aún</p>
            <p className="text-xs text-muted-foreground">
              Aquí verás el historial de créditos usados por cada viaje completado.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
