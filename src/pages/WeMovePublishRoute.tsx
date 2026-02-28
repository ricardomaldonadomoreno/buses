import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocations } from '@/hooks/useWeMoveData';
import { useMyTransportUnits, usePublishWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Calendar, Users, Bus, Loader2,
  PawPrint, Wind, Wifi, Home, Info, Check, ArrowRight, Luggage
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatDef { row: number; col: number; label: string; type: string; }
interface SeatLayout {
  id: string; name: string; vehicle_type: string;
  rows: number; cols: number; total_seats: number; layout_json: SeatDef[];
}

function useSeatLayouts(vehicleType?: string) {
  return useQuery({
    queryKey: ['seat-layouts', vehicleType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seat_layouts').select('*').order('total_seats');
      if (error) throw error;
      return (data as SeatLayout[]).filter(l =>
        !vehicleType || l.vehicle_type === vehicleType
      );
    },
  });
}

function OptionToggle({ icon: Icon, label, description, value, onChange }: {
  icon: React.ElementType; label: string; description?: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
        value ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border hover:bg-muted/40'
      )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', value ? 'text-primary' : 'text-foreground')}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
        value ? 'border-primary bg-primary' : 'border-border')}>
        {value && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function SeatGrid({ layout, seatCount, onCountChange }: {
  layout: SeatLayout; seatCount: number; onCountChange: (n: number) => void;
}) {
  const rows: Record<number, SeatDef[]> = {};
  layout.layout_json.forEach(s => {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row].push(s);
  });
  const maxSeats = layout.layout_json.filter(s => s.type === 'seat').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {layout.name}
        </p>
        <span className="text-xs text-primary font-semibold">{maxSeats} asientos</span>
      </div>
      <div className="bg-muted/30 rounded-2xl p-4 overflow-x-auto">
        <div className="space-y-1.5 w-fit mx-auto">
          {Object.entries(rows).sort(([a],[b]) => +a - +b).map(([r, seats]) => (
            <div key={r} className="flex gap-1.5 justify-center">
              {seats.sort((a,b) => a.col-b.col).map(s => {
                if (s.type === 'aisle') return <div key={s.label} className="w-6 h-6" />;
                return (
                  <div key={s.label}
                    className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"
                    title={s.label}>
                    <span className="text-[9px] font-bold text-primary/70">{s.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Asientos disponibles para este viaje</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onCountChange(Math.max(1, seatCount - 1))}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted transition-colors">−</button>
          <span className="text-lg font-bold w-6 text-center">{seatCount}</span>
          <button type="button" onClick={() => onCountChange(Math.min(maxSeats, seatCount + 1))}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg hover:bg-muted transition-colors">+</button>
        </div>
      </div>
    </div>
  );
}

export default function WeMovePublishRoute() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useWeMoveAuth();

  const { data: locations = [] } = useLocations();
  const { data: units = [] }     = useMyTransportUnits(user?.id);
  const publishRoute = usePublishWeMoveRoute();

  const [originId, setOriginId]         = useState('');
  const [destinationId, setDestId]      = useState('');
  const [departureDate, setDate]        = useState('');
  const [departureTime, setTime]        = useState('');
  const [availableSeats, setSeats]      = useState(4);
  const [price, setPrice]               = useState('');
  const [unitId, setUnitId]             = useState('');
  const [description, setDescription]   = useState('');
  const [notes, setNotes]               = useState('');
  const [currency, setCurrency]         = useState('BOB');
  const [submitting, setSubmitting]     = useState(false);
  const [acceptsPets, setPets]          = useState(false);
  const [acceptsLuggage, setLuggage]    = useState(true);
  const [hasAc, setAc]                  = useState(false);
  const [hasWifi, setWifi]              = useState(false);
  const [doorToDoor, setDoor]           = useState(false);
  const [layoutId, setLayoutId]         = useState('');

  const selectedUnit = units.find(u => u.id === unitId);
  const { data: layouts = [] } = useSeatLayouts(selectedUnit?.type);
  const selectedLayout = layouts.find(l => l.id === layoutId);

  useEffect(() => { if (units.length === 1 && !unitId) setUnitId(units[0].id); }, [units]);
  useEffect(() => {
    if (layouts.length > 0 && !layoutId) setLayoutId(layouts[0].id);
  }, [layouts]);
  useEffect(() => {
    if (selectedLayout) setSeats(selectedLayout.total_seats);
  }, [selectedLayout?.id]);
  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!originId || !destinationId) { toast({ title: t('wemovePublish.errorSelectLocations'), variant: 'destructive' }); return; }
    if (originId === destinationId)  { toast({ title: t('wemovePublish.errorSameLocation'),    variant: 'destructive' }); return; }
    if (!departureDate || !departureTime) { toast({ title: t('wemovePublish.errorSelectDateTime'), variant: 'destructive' }); return; }
    if (!price || parseFloat(price) <= 0) { toast({ title: t('wemovePublish.errorInvalidPrice'), variant: 'destructive' }); return; }
    if (!unitId) { toast({ title: t('wemovePublish.errorSelectUnit'), variant: 'destructive' }); return; }

    const depISO = new Date(`${departureDate}T${departureTime}:00`).toISOString();
    if (new Date(depISO) <= new Date()) { toast({ title: t('wemovePublish.errorPastDate'), variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      const result = await publishRoute.mutateAsync({
        transporterId: user.id,
        transportUnitId: unitId,
        originId,
        destinationId,
        departureTime: depISO,
        availableSeats,
        price: parseFloat(price),
      });

      if (result?.id) {
        await supabase.from('wemove_routes').update({
          description: description || null,
          notes: notes || null,
          currency,
          accepts_pets: acceptsPets,
          accepts_luggage: acceptsLuggage,
          has_ac: hasAc,
          has_wifi: hasWifi,
          door_to_door: doorToDoor,
          vehicle_type: selectedUnit?.type ?? null,
        }).eq('id', result.id);

        if (selectedLayout) {
          const seatRows = selectedLayout.layout_json
            .filter(s => s.type === 'seat')
            .slice(0, availableSeats)
            .map(s => ({
              route_id: result.id, seat_label: s.label,
              seat_row: s.row, seat_col: s.col,
              seat_type: 'seat', status: 'available',
            }));
          await supabase.from('route_seats').insert(seatRows);
        }
      }

      toast({ title: '🎉 ' + t('wemovePublish.successPublished') });
      navigate('/wemove/dashboard');
    } catch (err: unknown) {
      toast({ title: t('wemovePublish.errorPublishing'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive' });
    } finally {
      setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const cities = locations.filter((l: any) => l.type === 'city');
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove/dashboard" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="WeMove" className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity" />
            <span className="font-serif text-lg font-semibold hidden sm:block">We<span className="text-primary">Move</span></span>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-2xl">
        <div className="mb-6">
          <Link to="/wemove/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />{t('weMoveDashboard.backToDashboard')}
          </Link>
          <h1 className="font-serif text-2xl font-semibold">{t('wemovePublish.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('wemovePublish.subtitle')}</p>
        </div>

        {units.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <Bus className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-amber-800">{t('wemovePublish.noUnitsTitle')}</p>
            <p className="text-sm text-amber-700 mt-1">{t('wemovePublish.noUnitsDesc')}</p>
            <Link to="/wemove/profile" className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors">
              {t('wemovePublish.goToProfile')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <FormCard title={t('wemovePublish.sectionRoute')} icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t('wemovePublish.origin')}>
                  <Select value={originId} onValueChange={setOriginId}>
                    <SelectTrigger className="rounded-xl border-border/60"><SelectValue placeholder={t('wemovePublish.selectOrigin')} /></SelectTrigger>
                    <SelectContent>{cities.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('wemovePublish.destination')}>
                  <Select value={destinationId} onValueChange={setDestId}>
                    <SelectTrigger className="rounded-xl border-border/60"><SelectValue placeholder={t('wemovePublish.selectDestination')} /></SelectTrigger>
                    <SelectContent>{cities.filter((l: any) => l.id !== originId).map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
              </div>
              <FormField label="Descripción (opcional)">
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Viaje directo, sin paradas" className="rounded-xl border-border/60" />
              </FormField>
            </FormCard>

            <FormCard title={t('wemovePublish.sectionDateTime')} icon={Calendar}>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('wemovePublish.date')}>
                  <Input type="date" min={minDate} value={departureDate} onChange={e => setDate(e.target.value)} className="rounded-xl border-border/60" />
                </FormField>
                <FormField label={t('wemovePublish.time')}>
                  <Input type="time" value={departureTime} onChange={e => setTime(e.target.value)} className="rounded-xl border-border/60" />
                </FormField>
              </div>
            </FormCard>

            <FormCard title={t('wemovePublish.sectionUnit')} icon={Bus}>
              <FormField label={t('wemovePublish.selectUnit')}>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger className="rounded-xl border-border/60"><SelectValue placeholder={t('wemovePublish.selectUnitPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.type.charAt(0).toUpperCase() + u.type.slice(1)} — {u.capacity} asientos{u.verified ? ' ✓' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {unitId && layouts.length > 0 && (
                <>
                  <FormField label="Distribución de asientos">
                    <Select value={layoutId} onValueChange={setLayoutId}>
                      <SelectTrigger className="rounded-xl border-border/60"><SelectValue placeholder="Selecciona distribución" /></SelectTrigger>
                      <SelectContent>{layouts.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  {selectedLayout && <SeatGrid layout={selectedLayout} seatCount={availableSeats} onCountChange={setSeats} />}
                </>
              )}
            </FormCard>

            <FormCard title="Precio" icon={Users}>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <FormField label={t('wemovePublish.pricePerSeat')}>
                    <Input type="number" min="0" step="0.50" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="rounded-xl border-border/60 text-lg font-semibold" />
                  </FormField>
                </div>
                <FormField label="Moneda">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOB">BOB (Bs.)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PEN">PEN (S/.)</SelectItem>
                      <SelectItem value="CLP">CLP ($)</SelectItem>
                      <SelectItem value="ARS">ARS ($)</SelectItem>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </FormCard>

            <FormCard title="Opciones del viaje" icon={Info}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <OptionToggle icon={PawPrint} label="Acepta mascotas" description="Perros, gatos u otros animales" value={acceptsPets} onChange={setPets} />
                <OptionToggle icon={Luggage} label="Equipaje extra" description="Maletas o bultos adicionales" value={acceptsLuggage} onChange={setLuggage} />
                <OptionToggle icon={Wind} label="Aire acondicionado" description="Vehículo con A/C" value={hasAc} onChange={setAc} />
                <OptionToggle icon={Wifi} label="WiFi a bordo" description="Conexión durante el viaje" value={hasWifi} onChange={setWifi} />
                <OptionToggle icon={Home} label="Puerta a puerta" description="Recojo y entrega en domicilio" value={doorToDoor} onChange={setDoor} />
              </div>
              <FormField label="Notas adicionales (opcional)">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Ej: Sin alimentos fuertes, parada en terminal..."
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </FormField>
            </FormCard>

            {originId && destinationId && price && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Vista previa</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚌</span>
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <span>{cities.find((c: any) => c.id === originId)?.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{cities.find((c: any) => c.id === destinationId)?.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {departureDate}{departureTime ? ` · ${departureTime}` : ''} · {availableSeats} asientos · {currency} {price}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 min-h-[56px]">
              {submitting
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Publicando…</>
                : t('wemovePublish.publishButton')
              }
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

function FormCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
