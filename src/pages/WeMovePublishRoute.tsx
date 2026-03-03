// src/pages/WeMovePublishRoute.tsx — REESCRITO COMPLETO
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useMyTransportUnits, usePublishWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { LocationCombobox } from '@/components/wemove/LocationCombobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, ArrowRight, Bus, Calendar, Users,
  DollarSign, MapPin, CheckCircle, Loader2, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VEHICLE_LABELS: Record<string,string> = {
  bus:'Bus', microbus:'Microbus', van:'Van', minibus:'Minibus',
  coaster:'Coaster', sedan:'Sedan', suv:'SUV', boat:'Lancha/Bote', plane:'Avioneta'
};

export default function WeMovePublishRoute() {
  const navigate       = useNavigate();
  const { toast }      = useToast();
  const { user, loading } = useWeMoveAuth();
  const { data: units = [] } = useMyTransportUnits(user?.id);
  const publishRoute   = usePublishWeMoveRoute();

  // Form state
  const [originId,   setOriginId]   = useState('');
  const [originName, setOriginName] = useState('');
  const [destId,     setDestId]     = useState('');
  const [destName,   setDestName]   = useState('');
  const [date,       setDate]       = useState('');
  const [time,       setTime]       = useState('');
  const [unitId,     setUnitId]     = useState('');
  const [seats,      setSeats]      = useState('');
  const [price,      setPrice]      = useState('');
  const [notes,      setNotes]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  // Auto-seleccionar única unidad
  useEffect(() => {
    if (units.length === 1 && !unitId) setUnitId(units[0].id);
  }, [units]);

  // Auto-llenar asientos según la unidad seleccionada
  const selectedUnit = units.find(u => u.id === unitId);
  useEffect(() => {
    if (selectedUnit && !seats) setSeats(String(selectedUnit.capacity));
  }, [selectedUnit]);

  const maxSeats = selectedUnit?.capacity ?? 60;

  const minDate = new Date().toISOString().split('T')[0];

  const isValid = originId && destId && originId !== destId &&
    date && time && unitId && seats && price &&
    parseInt(seats) >= 1 && parseFloat(price) > 0;

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setSubmitting(true);
    try {
      const departureTime = new Date(`${date}T${time}`).toISOString();
      await publishRoute.mutateAsync({
        transporterId:   user.id,
        transportUnitId: unitId,
        originId,
        destinationId:   destId,
        departureTime,
        availableSeats:  parseInt(seats),
        price:           parseFloat(price),
      });

      // Guardar notas si hay
      if (notes.trim()) {
        // Se guarda en la ruta recién creada — buscarla por transporter + departure
        const { data: newRoute } = await supabase
          .from('wemove_routes')
          .select('id')
          .eq('transporter_id', user.id)
          .eq('departure_time', departureTime)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (newRoute) {
          await supabase.from('wemove_routes').update({ notes: notes.trim() }).eq('id', newRoute.id);
        }
      }

      toast({ title: '🎉 ¡Viaje publicado!' });
      navigate('/wemove/dashboard');
    } catch (err: any) {
      toast({ title: 'Error al publicar', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-14 items-center justify-between">
          <Link to="/wemove/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver al panel
          </Link>
          <span className="font-serif font-semibold text-lg">
            We<span className="text-primary">Move</span>
          </span>
          <div className="w-24" />
        </div>
      </header>

      <main className="flex-1 container max-w-lg py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black">Publicar viaje</h1>
          <p className="text-sm text-muted-foreground mt-1">Define los detalles de tu próximo viaje</p>
        </div>

        {/* Sin unidades */}
        {units.length === 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Primero registra un vehículo</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Necesitas al menos una unidad registrada para publicar viajes.
              </p>
              <Link to="/wemove/profile"
                className="text-xs font-bold text-amber-800 underline mt-2 inline-block">
                Ir a Mi perfil →
              </Link>
            </div>
          </div>
        )}

        {/* Sección: Ruta */}
        <Section icon={<MapPin className="h-4 w-4" />} title="Ruta">
          <div className="grid grid-cols-1 gap-3">
            <LocationCombobox
              label="Ciudad de origen"
              value={originId}
              onChange={(id, name) => { setOriginId(id); setOriginName(name); }}
              placeholder="Escribe o busca ciudad de origen…"
              excludeId={destId}
            />
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <LocationCombobox
              label="Ciudad de destino"
              value={destId}
              onChange={(id, name) => { setDestId(id); setDestName(name); }}
              placeholder="Escribe o busca ciudad de destino…"
              excludeId={originId}
            />
            {originId && destId && originId === destId && (
              <p className="text-xs text-destructive font-bold">
                Origen y destino no pueden ser la misma ciudad.
              </p>
            )}
          </div>
          <div className="mt-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
              Descripción del viaje (opcional)
            </label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Viaje directo sin paradas, salida desde terminal"
              className="rounded-xl border-foreground/30"
            />
          </div>
        </Section>

        {/* Sección: Fecha y hora */}
        <Section icon={<Calendar className="h-4 w-4" />} title="Fecha y hora de salida">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Fecha
              </label>
              <Input
                type="date" min={minDate} value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-xl border-foreground/30"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Hora
              </label>
              <Input
                type="time" value={time}
                onChange={e => setTime(e.target.value)}
                className="rounded-xl border-foreground/30"
              />
            </div>
          </div>
        </Section>

        {/* Sección: Vehículo */}
        <Section icon={<Bus className="h-4 w-4" />} title="Vehículo">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin unidades registradas.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {units.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => setUnitId(unit.id)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all',
                    unitId === unit.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-foreground/40'
                  )}
                >
                  <span className="text-2xl">
                    {unit.type === 'sedan' ? '🚗' : unit.type === 'suv' ? '🚙' :
                     unit.type === 'boat' ? '⛵' : unit.type === 'plane' ? '✈️' : '🚐'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      {VEHICLE_LABELS[unit.type] ?? unit.type}
                      {(unit as any).plate ? ` · ${(unit as any).plate}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit.capacity} asientos
                      {(unit as any).color ? ` · ${(unit as any).color}` : ''}
                    </p>
                  </div>
                  {unitId === unit.id && (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Sección: Asientos y precio */}
        <Section icon={<Users className="h-4 w-4" />} title="Asientos y precio">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Asientos a vender
              </label>
              <Input
                type="number" min="1" max={maxSeats} value={seats}
                onChange={e => setSeats(e.target.value)}
                placeholder={`Máx. ${maxSeats}`}
                className="rounded-xl border-foreground/30"
              />
              {selectedUnit && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Capacidad de tu vehículo: {maxSeats}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Precio por asiento (Bs.)
              </label>
              <Input
                type="number" min="1" step="0.5" value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ej: 50"
                className="rounded-xl border-foreground/30"
              />
            </div>
          </div>
        </Section>

        {/* Preview */}
        {isValid && (
          <div className="border-4 border-primary rounded-2xl overflow-hidden">
            <div className="bg-primary px-4 py-2.5">
              <p className="text-primary-foreground font-black text-xs uppercase tracking-widest">
                Vista previa del viaje
              </p>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-black text-base">
                <MapPin className="h-4 w-4 text-primary" />
                {originName}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <MapPin className="h-4 w-4 text-destructive" />
                {destName}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {date} · {time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {seats} asientos
                </span>
                <span className="flex items-center gap-1 font-bold text-primary">
                  <DollarSign className="h-3 w-3" />
                  Bs. {price} / asiento
                </span>
              </div>
              {notes && <p className="text-xs text-muted-foreground italic">📌 {notes}</p>}
            </div>
          </div>
        )}

        {/* Botón publicar */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || units.length === 0}
          className="w-full py-4 bg-primary text-primary-foreground font-black text-sm rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando…</>
            : '🚀 Publicar viaje'
          }
        </button>
      </main>
    </div>
  );
}

// ── Sección visual ────────────────────────────────────────────
function Section({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40 bg-muted/20">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
