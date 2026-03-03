// src/pages/WeMovePublishRoute.tsx — COMPLETO con i18n + teléfono libre
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useMyTransportUnits, useMyUserData, usePublishWeMoveRoute } from '@/hooks/useWeMoveTransporter';
import { LocationCombobox } from '@/components/wemove/LocationCombobox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, Bus, Calendar, Users, Phone,
  DollarSign, MapPin, CheckCircle, Loader2, AlertCircle,
  MessageCircle, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VEHICLE_LABELS: Record<string, string> = {
  bus: 'Bus', microbus: 'Microbus', van: 'Van', minibus: 'Minibus',
  coaster: 'Coaster', sedan: 'Sedan', suv: 'SUV', boat: 'Lancha/Bote', plane: 'Avioneta'
};

const CURRENCIES = [
  { code: 'BOB', symbol: 'Bs.', label: 'BOB (Bs.)' },
  { code: 'USD', symbol: '$',   label: 'USD ($)' },
  { code: 'PEN', symbol: 'S/.', label: 'PEN (S/.)' },
  { code: 'ARS', symbol: '$',   label: 'ARS ($)' },
  { code: 'BRL', symbol: 'R$',  label: 'BRL (R$)' },
];

// ── Componente toggle para opciones del viaje ─────────────────
function OptionToggle({ checked, onChange, label, desc, icon }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; desc: string; icon: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all w-full',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border/60 hover:border-foreground/30'
      )}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className={cn(
        'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
        checked ? 'border-primary bg-primary' : 'border-border'
      )}>
        {checked && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
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

// ── Label pequeño ─────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
      {children}
    </label>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function WeMovePublishRoute() {
  const { t }          = useTranslation();
  const navigate       = useNavigate();
  const { toast }      = useToast();
  const { user, loading } = useWeMoveAuth();

  const { data: units = [] }    = useMyTransportUnits(user?.id);
  const { data: userData }      = useMyUserData(user?.id);
  const publishRoute            = usePublishWeMoveRoute();

  // Ruta
  const [originId,   setOriginId]   = useState('');
  const [originName, setOriginName] = useState('');
  const [destId,     setDestId]     = useState('');
  const [destName,   setDestName]   = useState('');

  // Descripción
  const [description, setDescription] = useState('');

  // Contacto
  const [address,      setAddress]    = useState('');
  const [whatsapp,     setWhatsapp]   = useState('');
  const [groupLink,    setGroupLink]  = useState('');
  const [showGroupHelp, setShowGroupHelp] = useState(false);

  // Fecha/hora
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Unidad
  const [unitId, setUnitId] = useState('');

  // Precio
  const [price,    setPrice]    = useState('');
  const [currency, setCurrency] = useState('BOB');

  // Asientos
  const [seats, setSeats] = useState('');

  // Opciones
  const [optPets,        setOptPets]        = useState(false);
  const [optLuggage,     setOptLuggage]     = useState(false);
  const [optAC,          setOptAC]          = useState(false);
  const [optWifi,        setOptWifi]        = useState(false);
  const [optDoorToDoor,  setOptDoorToDoor]  = useState(false);

  // Notas
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  // Auto-seleccionar única unidad
  useEffect(() => {
    if (units.length === 1 && !unitId) setUnitId(units[0].id);
  }, [units]);

  // Auto-fill asientos al seleccionar unidad
  const selectedUnit = units.find(u => u.id === unitId);
  useEffect(() => {
    if (selectedUnit && !seats) setSeats(String(selectedUnit.capacity));
  }, [selectedUnit]);

  // Auto-fill WhatsApp desde el perfil del conductor
  useEffect(() => {
    if (userData?.phone_full && !whatsapp) {
      setWhatsapp(userData.phone_full);
    }
  }, [userData]);

  const maxSeats  = selectedUnit?.capacity ?? 60;
  const minDate   = new Date().toISOString().split('T')[0];
  const isValid   = originId && destId && originId !== destId &&
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

      // Guardar campos extra en la ruta recién creada
      const extras: Record<string, any> = {};
      if (description.trim())  extras.notes          = description.trim();
      if (address.trim())      extras.departure_address = address.trim();
      if (whatsapp.trim())     extras.whatsapp_number   = whatsapp.trim();
      if (groupLink.trim())    extras.whatsapp_group    = groupLink.trim();
      if (currency !== 'BOB')  extras.currency          = currency;
      extras.option_pets         = optPets;
      extras.option_luggage      = optLuggage;
      extras.option_ac           = optAC;
      extras.option_wifi         = optWifi;
      extras.option_door_to_door = optDoorToDoor;
      if (notes.trim())        extras.additional_notes  = notes.trim();

      if (Object.keys(extras).length > 0) {
        const { data: newRoute } = await supabase
          .from('wemove_routes')
          .select('id')
          .eq('transporter_id', user.id)
          .eq('departure_time', departureTime)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (newRoute) {
          await supabase.from('wemove_routes').update(extras).eq('id', newRoute.id);
        }
      }

      toast({ title: '🎉 ' + t('wemovePublish.successPublished') });
      navigate('/wemove/dashboard');
    } catch (err: any) {
      toast({ title: t('wemovePublish.errorSelectLocations'), description: err.message, variant: 'destructive' });
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
          <Link to="/wemove/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('weMoveDashboard.backToDashboard')}
          </Link>
          <span className="font-serif font-semibold text-lg">
            We<span className="text-primary">Move</span>
          </span>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 container max-w-lg py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-black">{t('wemovePublish.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('wemovePublish.subtitle')}</p>
        </div>

        {/* Alerta sin unidades */}
        {units.length === 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">{t('wemovePublish.noUnitsWarning')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('wemovePublish.noUnitsWarningDesc')}</p>
              <Link to="/wemove/profile"
                className="text-xs font-bold text-amber-800 underline mt-2 inline-block">
                {t('wemovePublish.goToProfileLink')}
              </Link>
            </div>
          </div>
        )}

        {/* ── RUTA ── */}
        <Section icon={<MapPin className="h-4 w-4" />} title={t('wemovePublish.sectionRoute')}>
          <div className="space-y-3">
            <LocationCombobox
              label={t('wemovePublish.origin')}
              value={originId}
              onChange={(id, name) => { setOriginId(id); setOriginName(name); }}
              placeholder={t('wemovePublish.selectOrigin')}
              excludeId={destId}
            />
            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <LocationCombobox
              label={t('wemovePublish.destination')}
              value={destId}
              onChange={(id, name) => { setDestId(id); setDestName(name); }}
              placeholder={t('wemovePublish.selectDestination')}
              excludeId={originId}
            />
            {originId && destId && originId === destId && (
              <p className="text-xs text-destructive font-bold">
                {t('wemovePublish.errorSameLocation')}
              </p>
            )}
            <div>
              <FieldLabel>{t('wemovePublish.descriptionLabel')}</FieldLabel>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('wemovePublish.descriptionPlaceholder')}
                className="rounded-xl border-foreground/30"
              />
            </div>
          </div>
        </Section>

        {/* ── CONTACTO ── */}
        <Section icon={<MessageCircle className="h-4 w-4" />} title={t('wemovePublish.sectionContact')}>
          <div className="space-y-4">
            {/* Dirección */}
            <div>
              <FieldLabel>{t('wemovePublish.departureAddress')} *</FieldLabel>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={t('wemovePublish.departureAddressPlaceholder')}
                className="rounded-xl border-foreground/30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('wemovePublish.departureAddressHint')}
              </p>
            </div>

            {/* WhatsApp — campo de texto libre, pre-llenado del perfil */}
            <div>
              <FieldLabel>{t('wemovePublish.whatsappNumber')}</FieldLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder={t('wemovePublish.whatsappNumberPlaceholder')}
                  className="pl-9 rounded-xl border-foreground/30"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('wemovePublish.whatsappNumberHint')}
              </p>
            </div>

            {/* Grupo WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel>{t('wemovePublish.whatsappGroup')}</FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowGroupHelp(!showGroupHelp)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <HelpCircle className="h-3 w-3" />
                  {t('wemovePublish.whatsappGroupHelp')}
                  {showGroupHelp
                    ? <ChevronUp className="h-3 w-3" />
                    : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {t('wemovePublish.whatsappGroupDesc')}
              </p>
              <Input
                value={groupLink}
                onChange={e => setGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="rounded-xl border-foreground/30 font-mono text-sm"
              />
              {showGroupHelp && (
                <div className="mt-3 bg-muted/40 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-bold text-foreground">
                    {t('wemovePublish.whatsappGroupHelp')}
                  </p>
                  {[
                    t('wemovePublish.whatsappGroupStep1'),
                    t('wemovePublish.whatsappGroupStep2'),
                    t('wemovePublish.whatsappGroupStep3'),
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── FECHA Y HORA ── */}
        <Section icon={<Calendar className="h-4 w-4" />} title={t('wemovePublish.sectionDateTime')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>{t('wemovePublish.date')}</FieldLabel>
              <Input
                type="date" min={minDate} value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-xl border-foreground/30"
              />
            </div>
            <div>
              <FieldLabel>{t('wemovePublish.time')}</FieldLabel>
              <Input
                type="time" value={time}
                onChange={e => setTime(e.target.value)}
                className="rounded-xl border-foreground/30"
              />
            </div>
          </div>
        </Section>

        {/* ── VEHÍCULO ── */}
        <Section icon={<Bus className="h-4 w-4" />} title={t('wemovePublish.sectionUnit')}>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('wemovePublish.noUnitsDesc')}</p>
          ) : (
            <div className="space-y-2">
              {units.map(unit => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setUnitId(unit.id)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 text-left w-full transition-all',
                    unitId === unit.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-foreground/40'
                  )}
                >
                  <span className="text-2xl">
                    {unit.type === 'sedan' ? '🚗' : unit.type === 'suv' ? '🚙' :
                     unit.type === 'boat'  ? '⛵' : unit.type === 'plane' ? '✈️' : '🚐'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      {VEHICLE_LABELS[unit.type] ?? unit.type}
                      {(unit as any).plate ? ` · ${(unit as any).plate}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit.capacity} {t('wemoveProfile.seats')}
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

        {/* ── PRECIO ── */}
        <Section icon={<DollarSign className="h-4 w-4" />} title={t('wemovePublish.sectionPrice')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>{t('wemovePublish.seatsLabel')}</FieldLabel>
              <Input
                type="number" min="1" max={maxSeats} value={seats}
                onChange={e => setSeats(e.target.value)}
                placeholder={`Máx. ${maxSeats}`}
                className="rounded-xl border-foreground/30"
              />
              {selectedUnit && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('wemovePublish.unitCapacityHint', { max: maxSeats })}
                </p>
              )}
            </div>
            <div>
              <FieldLabel>{t('wemovePublish.pricePerSeat')}</FieldLabel>
              <Input
                type="number" min="1" step="0.5" value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ej: 50"
                className="rounded-xl border-foreground/30"
              />
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel>{t('wemovePublish.currency')}</FieldLabel>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="rounded-xl border-foreground/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* ── OPCIONES ── */}
        <Section icon={<CheckCircle className="h-4 w-4" />} title={t('wemovePublish.sectionOptions')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <OptionToggle checked={optPets}       onChange={setOptPets}
              label={t('wemovePublish.optionPets')}       desc={t('wemovePublish.optionPetsDesc')}       icon="🐾" />
            <OptionToggle checked={optLuggage}    onChange={setOptLuggage}
              label={t('wemovePublish.optionLuggage')}    desc={t('wemovePublish.optionLuggageDesc')}    icon="🧳" />
            <OptionToggle checked={optAC}         onChange={setOptAC}
              label={t('wemovePublish.optionAC')}         desc={t('wemovePublish.optionACDesc')}         icon="❄️" />
            <OptionToggle checked={optWifi}       onChange={setOptWifi}
              label={t('wemovePublish.optionWifi')}       desc={t('wemovePublish.optionWifiDesc')}       icon="📶" />
            <OptionToggle checked={optDoorToDoor} onChange={setOptDoorToDoor}
              label={t('wemovePublish.optionDoorToDoor')} desc={t('wemovePublish.optionDoorToDoorDesc')} icon="🏠" />
          </div>
          <div className="mt-4">
            <FieldLabel>{t('wemovePublish.notesLabel')}</FieldLabel>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('wemovePublish.notesPlaceholder')}
              rows={2}
              className="w-full rounded-xl border-2 border-foreground/30 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </Section>

        {/* Vista previa */}
        {isValid && (
          <div className="border-4 border-primary rounded-2xl overflow-hidden">
            <div className="bg-primary px-4 py-2.5">
              <p className="text-primary-foreground font-black text-xs uppercase tracking-widest">
                {t('wemovePublish.previewTitle')}
              </p>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 font-black text-base flex-wrap">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {originName}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <MapPin className="h-4 w-4 text-destructive shrink-0" />
                {destName}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{date} · {time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{seats} {t('wemovePublish.seats')}
                </span>
                <span className="flex items-center gap-1 font-bold text-primary">
                  <DollarSign className="h-3 w-3" />
                  {CURRENCIES.find(c => c.code === currency)?.symbol}{price} / {t('wemovePublish.seats').toLowerCase()}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {optPets        && <span className="text-xs bg-muted rounded-lg px-2 py-0.5">🐾</span>}
                {optLuggage     && <span className="text-xs bg-muted rounded-lg px-2 py-0.5">🧳</span>}
                {optAC          && <span className="text-xs bg-muted rounded-lg px-2 py-0.5">❄️</span>}
                {optWifi        && <span className="text-xs bg-muted rounded-lg px-2 py-0.5">📶</span>}
                {optDoorToDoor  && <span className="text-xs bg-muted rounded-lg px-2 py-0.5">🏠</span>}
              </div>
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
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}</>
            : `🚀 ${t('wemovePublish.publishButton')}`
          }
        </button>

        <div className="h-6" />
      </main>
    </div>
  );
}
