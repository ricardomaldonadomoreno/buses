// src/pages/WeMoveCompleteProfile.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useMyProfile, useMyUserData, useMyTransportUnits,
  useMyWeMoveTransporter, useUpdateProfile,
  useUpsertTransportUnit, useDeleteTransportUnit,
} from '@/hooks/useWeMoveTransporter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SeatLayoutEditor, SeatLayout } from '@/components/wemove/SeatLayoutEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Pencil, Trash2, Bus, CheckCircle, Clock,
  Upload, FileText, Camera, Car, Shield, AlertCircle, Loader2,
  X, Eye, Layout, Share2, MapPin, Star, AlertTriangle, ChevronDown,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VEHICLE_TYPES = ['bus', 'microbus', 'van', 'minibus', 'coaster', 'sedan', 'suv', 'boat', 'plane'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DOC_SIZE  = 5 * 1024 * 1024; // 5 MB

function validateImage(file: File, onError: (msg: string) => void): boolean {
  if (!ALLOWED_MIME.includes(file.type)) { onError('onlyImages'); return false; }
  if (file.size > MAX_DOC_SIZE) { onError('maxDoc'); return false; }
  return true;
}
function mimeToExt(mime: string) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

// ── Hook de documentos del transportador ─────────────────────
// Lee directamente desde wemove_transporters (campos que añadió la migración)
function useTransporterDocs(userId?: string) {
  return useQuery({
    queryKey: ['transporter-docs', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('wemove_transporters')
        .select(
          'id_card_url, license_url, selfie_url, vehicle_photo_url, ' +
          'verification_status, documents_submitted, submitted_at, rejection_reason'
        )
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// ── Acordeón ──────────────────────────────────────────────────
function Accordion({
  title, subtitle, icon: Icon, defaultOpen = false, badge, children,
}: {
  title: string; subtitle?: string; icon: React.ElementType;
  defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          {badge && <div className="ml-2 shrink-0">{badge}</div>}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-3', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-border/40">{children}</div>}
    </section>
  );
}

// ── Componente de carga de documento individual ───────────────
function DocUpload({
  label, icon: Icon, docKey, userId, currentUrl, onUploaded,
  bucket = 'transporter-docs', pathPrefix,
}: {
  label: string; icon: React.ElementType; docKey: string; userId: string;
  currentUrl?: string | null; onUploaded: (url: string) => void;
  bucket?: string; pathPrefix?: string;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef  = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sincronizar preview si la URL externa cambia (p.ej. al refetch)
  useEffect(() => { setPreview(currentUrl ?? null); }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!validateImage(file, (k) => toast({ title: t(`wemoveProfile.${k}`), variant: 'destructive' }))) return;

    setUploading(true);
    try {
      const ext  = mimeToExt(file.type);
      const pre  = pathPrefix ?? userId;
      const path = `${pre}/${docKey}.${ext}`;

      // Subir al bucket (upsert para permitir reemplazar)
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

      // Actualizar la columna correspondiente en wemove_transporters
      // Solo para documentos de identidad (bucket = transporter-docs y no es unidad)
      if (bucket === 'transporter-docs' && !pathPrefix?.includes('units')) {
        const { error: dbErr } = await supabase
          .from('wemove_transporters')
          .update({ [`${docKey}_url`]: publicUrl })
          .eq('user_id', userId);
        if (dbErr) throw dbErr;
      }

      setPreview(URL.createObjectURL(file));
      onUploaded(publicUrl);
      toast({ title: t('wemoveProfile.uploadedOk') });
    } catch (err: any) {
      toast({ title: t('wemoveProfile.errorUpload'), description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <div className={cn(
        'border-2 border-dashed rounded-xl p-4 text-center transition-all',
        preview ? 'border-green-400 bg-green-50/5' : 'border-border/60 bg-muted/10',
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : preview ? (
          <div className="space-y-3">
            {/* Miniatura de la imagen subida */}
            <a href={preview} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={preview}
                alt={label}
                className="w-full h-28 object-cover rounded-lg border border-border/40 hover:opacity-90 transition-opacity"
              />
            </a>
            <div className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                {t('wemoveProfile.fileUploaded')}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Upload className="h-3 w-3" /> {t('wemoveProfile.gallery')}
                </button>
                <button
                  type="button"
                  onClick={() => camRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Camera className="h-3 w-3" /> {t('wemoveProfile.camera')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <Upload className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{t('wemoveProfile.uploadHint')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                <Upload className="h-3 w-3" /> {t('wemoveProfile.gallery')}
              </button>
              <button
                type="button"
                onClick={() => camRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Camera className="h-3 w-3" /> {t('wemoveProfile.camera')}
              </button>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
        <input ref={camRef}  type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={onChange} />
      </div>
    </div>
  );
}

// ── Avatar upload ─────────────────────────────────────────────
function AvatarUpload({ userId, currentUrl, displayName, onUploaded }: {
  userId: string; currentUrl?: string | null; displayName: string; onUploaded: (url: string) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { setPreview(currentUrl ?? null); }, [currentUrl]);

  const handleFile = async (file: File) => {
    if (!validateImage(file, (k) => toast({ title: t(`wemoveProfile.${k}`), variant: 'destructive' }))) return;

    setUploading(true);
    try {
      const ext  = mimeToExt(file.type);
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('transporter-docs')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('transporter-docs').getPublicUrl(path);

      // Actualizar en ambas tablas para mantener consistencia
      await Promise.all([
        supabase.from('wemove_transporters').update({ avatar_url: publicUrl }).eq('user_id', userId),
        supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId),
      ]);

      setPreview(URL.createObjectURL(file));
      onUploaded(publicUrl);
      toast({ title: t('wemoveProfile.avatarUpdated') });
    } catch (err: any) {
      toast({ title: t('wemoveProfile.errorUploadPhoto'), description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 overflow-hidden
          bg-primary/10 flex items-center justify-center text-2xl font-black text-primary
          group-hover:border-primary/50 transition-all">
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin text-primary" />
            : preview
              ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              : <span>{initials}</span>
          }
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('wemoveProfile.changePhoto')}</p>
      <input
        ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Sección de documentos ─────────────────────────────────────
function DocsSection({ userId, docs, isVerified, isRejected, onRefresh }: {
  userId: string;
  docs: any;
  isVerified: boolean;
  isRejected: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = !!docs?.documents_submitted;
  // Cuántos documentos ya se han subido
  const uploadedCount = [docs?.id_card_url, docs?.license_url, docs?.selfie_url, docs?.vehicle_photo_url]
    .filter(Boolean).length;

  const handleSubmit = async () => {
    if (!docs?.id_card_url) {
      toast({ title: t('wemoveProfile.mustUploadIdFirst'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('wemove_transporters')
        .update({
          documents_submitted: true,
          submitted_at: new Date().toISOString(),
          verification_status: 'pending',
          rejection_reason: null, // limpiar motivo de rechazo anterior si existía
        })
        .eq('user_id', userId);
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ['my-wemove-transporter', userId] });
      qc.invalidateQueries({ queryKey: ['transporter-docs', userId] });
      toast({ title: t('wemoveProfile.docsSubmitted') });
    } catch (err: any) {
      toast({ title: t('wemoveProfile.errorSubmit'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Banner de rechazo — solo si fue rechazado */}
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{t('wemoveProfile.docsRejected')}</p>
            {docs?.rejection_reason && (
              <p className="text-xs text-red-700 mt-0.5">{docs.rejection_reason}</p>
            )}
            <p className="text-xs text-red-600 mt-1">{t('wemoveProfile.docsRejectedHint')}</p>
          </div>
        </div>
      )}

      {/* Progreso de documentos */}
      {!isVerified && (
        <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{t('wemoveProfile.docsProgress')}</span>
              <span>{uploadedCount}/4</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(uploadedCount / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid de los 4 documentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocUpload
          label={t('wemoveProfile.idCard')} icon={FileText}
          docKey="id_card" userId={userId} currentUrl={docs?.id_card_url}
          onUploaded={onRefresh}
        />
        <DocUpload
          label={t('wemoveProfile.driverLicense')} icon={Car}
          docKey="license" userId={userId} currentUrl={docs?.license_url}
          onUploaded={onRefresh}
        />
        <DocUpload
          label={t('wemoveProfile.selfieCard')} icon={Camera}
          docKey="selfie" userId={userId} currentUrl={docs?.selfie_url}
          onUploaded={onRefresh}
        />
        <DocUpload
          label={t('wemoveProfile.vehiclePhotoDoc')} icon={Car}
          docKey="vehicle_photo" userId={userId} currentUrl={docs?.vehicle_photo_url}
          onUploaded={onRefresh}
        />
      </div>

      {/* Botón enviar — visible solo si no está verificado ni enviado */}
      {!isVerified && !isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={submitting || !docs?.id_card_url}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
            hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" />{t('wemoveProfile.sending')}</>
            : <><Shield className="h-4 w-4" />{t('wemoveProfile.submitDocs')}</>
          }
        </button>
      )}

      {/* Enviado y en revisión */}
      {isSubmitted && !isVerified && !isRejected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 justify-center">
          <Clock className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            {t('wemoveProfile.submittedOn', {
              date: docs?.submitted_at ? new Date(docs.submitted_at).toLocaleDateString() : '—',
            })}
          </p>
        </div>
      )}

      {/* Verificado */}
      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 justify-center">
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-700 font-medium">{t('wemoveProfile.accountVerified')}</p>
        </div>
      )}
    </div>
  );
}

// ── Cómo funciona ─────────────────────────────────────────────
function HowItWorksContent() {
  const { t } = useTranslation();
  const steps = [
    { icon: Plus,        color: 'bg-green-100 text-green-700',   titleKey: 'step1Title', descKey: 'step1Desc' },
    { icon: MapPin,      color: 'bg-blue-100 text-blue-700',     titleKey: 'step2Title', descKey: 'step2Desc' },
    { icon: CheckCircle, color: 'bg-primary/10 text-primary',    titleKey: 'step3Title', descKey: 'step3Desc' },
    { icon: Star,        color: 'bg-yellow-100 text-yellow-700', titleKey: 'step4Title', descKey: 'step4Desc' },
  ];
  const warnKeys = ['warn1', 'warn2', 'warn3', 'warn4'];
  return (
    <div className="p-5 space-y-5">
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t(`wemoveProfile.${s.titleKey}`)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t(`wemoveProfile.${s.descKey}`)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">{t('wemoveProfile.careAccount')}</p>
        </div>
        <ul className="space-y-1.5">
          {warnKeys.map(k => (
            <li key={k} className="text-xs text-amber-800 flex gap-2">
              <span className="shrink-0 mt-0.5">·</span>
              <span>{t(`wemoveProfile.${k}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function WeMoveCompleteProfile() {
  const { t }     = useTranslation();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();
  const qc = useQueryClient();

  const { data: profile }     = useMyProfile(user?.id);
  const { data: userData }    = useMyUserData(user?.id);
  const { data: units = [], isLoading: unitsLoading } = useMyTransportUnits(user?.id);
  const { data: transporter } = useMyWeMoveTransporter(user?.id);
  const { data: docs, refetch: refetchDocs } = useTransporterDocs(user?.id);

  const updateProfile = useUpdateProfile();
  const upsertUnit    = useUpsertTransportUnit();
  const deleteUnit    = useDeleteTransportUnit();

  const [fullName, setFullName]    = useState('');
  const [avatarUrl, setAvatarUrl]  = useState<string | null>(null);
  const [savingProfile, setSaving] = useState(false);

  const [showUnitForm, setShowUnit]     = useState(false);
  const [editingUnitId, setEditUnit]    = useState<string | null>(null);
  const [unitType, setUnitType]         = useState('');
  const [unitCapacity, setUnitCapacity] = useState('');
  const [unitPlate, setUnitPlate]       = useState('');
  const [unitColor, setUnitColor]       = useState('');
  const [unitBrand, setUnitBrand]       = useState('');
  const [unitModel, setUnitModel]       = useState('');
  const [unitYear, setUnitYear]         = useState('');
  const [unitPhotoUrl, setUnitPhotoUrl] = useState('');
  const [savingUnit, setSavingUnit]     = useState(false);
  const [editorUnit, setEditorUnit]     = useState<{
    id: string; type: string; capacity: number; layout: SeatLayout | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    else if (userData) setFullName([userData.first_name, userData.last_name].filter(Boolean).join(' '));
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile, userData]);

  const handleSaveProfile = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ userId: user.id, fullName: fullName.trim() });
      toast({ title: t('wemoveProfile.profileSaved') });
    } catch {
      toast({ title: t('wemoveProfile.errorSavingProfile'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const resetUnitForm = () => {
    setShowUnit(false); setEditUnit(null);
    setUnitType(''); setUnitCapacity(''); setUnitPlate(''); setUnitColor('');
    setUnitBrand(''); setUnitModel(''); setUnitYear(''); setUnitPhotoUrl('');
  };

  const handleEditUnit = (unit: any) => {
    setEditUnit(unit.id); setUnitType(unit.type); setUnitCapacity(String(unit.capacity));
    setUnitPlate(unit.plate ?? ''); setUnitColor(unit.color ?? '');
    setUnitBrand(unit.brand ?? ''); setUnitModel(unit.model ?? '');
    setUnitYear(unit.year ? String(unit.year) : '');
    setUnitPhotoUrl(unit.photo_url ?? '');
    setShowUnit(true);
  };

  const handleUnitSubmit = async () => {
    if (!user || !unitType || !unitCapacity) return;
    const cap = parseInt(unitCapacity);
    if (isNaN(cap) || cap < 1) {
      toast({ title: t('wemoveProfile.invalidCapacity'), variant: 'destructive' }); return;
    }
    setSavingUnit(true);
    try {
      await upsertUnit.mutateAsync({
        unitId: editingUnitId ?? undefined,
        transporterId: user.id,
        type: unitType, capacity: cap,
        plate: unitPlate.trim() || undefined,
        color: unitColor.trim() || undefined,
        brand: unitBrand.trim() || undefined,
        model: unitModel.trim() || undefined,
        year: unitYear ? parseInt(unitYear) : undefined,
        photo_url: unitPhotoUrl || undefined,
      });
      toast({ title: editingUnitId ? t('wemoveProfile.unitUpdated') : t('wemoveProfile.unitAdded') });
      resetUnitForm();
    } catch {
      toast({ title: t('wemoveProfile.errorUnit'), variant: 'destructive' });
    } finally { setSavingUnit(false); }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!user || !confirm(t('wemoveProfile.confirmDelete'))) return;
    try {
      await deleteUnit.mutateAsync({ unitId, userId: user.id });
      toast({ title: t('wemoveProfile.unitDeleted') });
    } catch {
      toast({ title: t('wemoveProfile.errorDelete'), variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return null;

  const isVerified  = transporter?.verification_status === 'verified';
  const isRejected  = transporter?.verification_status === 'rejected';
  const isSubmitted = !!docs?.documents_submitted;
  const displayName = fullName || user.email?.split('@')[0] || '';

  const vehicleLabel = (type: string) =>
    t(`wemoveProfile.vehicleTypes.${type}`, { defaultValue: type });

  // Badge del acordeón de documentos
  const verBadge = isVerified
    ? <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />{t('wemoveProfile.badgeVerified')}
      </span>
    : isRejected
      ? <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <XCircle className="h-3 w-3" />{t('wemoveProfile.badgeRejected')}
        </span>
      : isSubmitted
        ? <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />{t('wemoveProfile.badgeUnderReview')}
          </span>
        : <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />{t('wemoveProfile.badgePending')}
          </span>;

  const unitsSubtitle = units.length > 0
    ? t(units.length === 1 ? 'wemoveProfile.unitsCount' : 'wemoveProfile.unitsCountPlural', { count: units.length })
    : t('wemoveProfile.noUnitsYet');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove/dashboard" className="flex items-center gap-3 group">
            <img
              src="/logo.png" alt="BUSES"
              className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-serif text-lg font-semibold">We<span className="text-primary">Move</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={async () => { await signOut(); navigate('/wemove'); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('wemoveProfile.back')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-2xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{t('wemoveProfile.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('wemoveProfile.subtitle')}</p>
        </div>

        {/* ── Información personal ── */}
        <Accordion title={t('wemoveProfile.personalInfo')} icon={FileText} defaultOpen>
          <div className="p-5 space-y-4">
            <div className="flex justify-center pb-2">
              <AvatarUpload
                userId={user.id} currentUrl={avatarUrl} displayName={displayName}
                onUploaded={url => {
                  setAvatarUrl(url);
                  qc.invalidateQueries({ queryKey: ['my-profile', user.id] });
                }}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('wemoveProfile.email')}</Label>
              <Input value={user.email ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('wemoveProfile.firstName')}</Label>
                <Input value={userData?.first_name ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('wemoveProfile.lastName')}</Label>
                <Input value={userData?.last_name ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('wemoveProfile.document')}</Label>
              <Input value={userData?.document_number ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('wemoveProfile.phone')}</Label>
              <Input value={userData?.phone_full ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('wemoveProfile.displayName')}</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder={t('wemoveProfile.displayNamePlaceholder')}
                  className="rounded-xl border-border/60 flex-1"
                />
                <button
                  onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shrink-0"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : t('wemoveProfile.save')}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('wemoveProfile.displayNameHint')}</p>
            </div>
          </div>
        </Accordion>

        {/* ── Documentos ── */}
        <Accordion
          title={t('wemoveProfile.docs')}
          subtitle={t('wemoveProfile.docsSubtitle')}
          icon={Shield}
          badge={verBadge}
          defaultOpen={isRejected} // abrir automáticamente si fue rechazado
        >
          <DocsSection
            userId={user.id}
            docs={docs}
            isVerified={isVerified}
            isRejected={isRejected}
            onRefresh={() => {
              refetchDocs();
              qc.invalidateQueries({ queryKey: ['transporter-docs', user.id] });
            }}
          />
        </Accordion>

        {/* ── Unidades ── */}
        <Accordion
          title={t('wemoveProfile.myUnits')}
          subtitle={unitsSubtitle}
          icon={Bus}
          defaultOpen={units.length === 0}
        >
          <div className="p-5 space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => { resetUnitForm(); setShowUnit(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {t('wemoveProfile.addUnit')}
              </button>
            </div>

            {unitsLoading ? (
              <div className="h-16 bg-muted/30 rounded-xl animate-pulse" />
            ) : units.length === 0 && !showUnitForm ? (
              <div className="text-center py-6">
                <Bus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('wemoveProfile.noUnitsRegistered')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {units.map(unit => (
                  <div key={unit.id} className="rounded-xl border border-border/60 bg-background overflow-hidden">
                    <div className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        {unit.photo_url
                          ? <img src={unit.photo_url} alt={unit.type} className="w-12 h-12 rounded-lg object-cover border border-border/40" />
                          : <span className="text-2xl">{{ bus: '🚌', microbus: '🚐', van: '🚐', minibus: '🚐', coaster: '🚌', sedan: '🚗', suv: '🚙', boat: '⛵', plane: '✈️' }[unit.type] ?? '🚐'}</span>
                        }
                        <div>
                          <p className="text-sm font-semibold">{vehicleLabel(unit.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {[unit.brand, unit.model, unit.year].filter(Boolean).join(' ')}
                            {unit.capacity ? ` · ${unit.capacity} ${t('wemoveProfile.capacity').toLowerCase()}` : ''}
                            {unit.plate ? ` · ${unit.plate}` : ''}
                            {unit.color ? ` · ${unit.color}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unit.verified
                          ? <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />{t('wemoveProfile.verified')}
                            </span>
                          : <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3" />{t('wemoveProfile.pendingVerification')}
                            </span>
                        }
                        <button
                          onClick={() => handleEditUnit(unit)}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-border/40 px-3.5 py-2.5 bg-muted/20">
                      <button
                        onClick={() => setEditorUnit({ id: unit.id, type: unit.type, capacity: unit.capacity, layout: unit.seat_layout ?? null })}
                        className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Layout className="h-3.5 w-3.5" />
                        {unit.seat_layout ? t('wemoveProfile.seatLayoutSaved') : t('wemoveProfile.seatLayout')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario de unidad */}
            {showUnitForm && (
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {editingUnitId ? t('wemoveProfile.editUnitLabel') : t('wemoveProfile.newUnit')}
                  </p>
                  <button onClick={resetUnitForm} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.vehicleType')}</Label>
                    <Select value={unitType} onValueChange={setUnitType}>
                      <SelectTrigger className="mt-1.5 rounded-xl border-border/60">
                        <SelectValue placeholder={t('wemoveProfile.selectVehicle')} />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(vt => <SelectItem key={vt} value={vt}>{vehicleLabel(vt)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.capacity')}</Label>
                    <Input type="number" min="1" max="60" value={unitCapacity}
                      onChange={e => setUnitCapacity(e.target.value)} placeholder="15"
                      className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.brand')}</Label>
                    <Input value={unitBrand} onChange={e => setUnitBrand(e.target.value)} placeholder="Toyota" className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.model')}</Label>
                    <Input value={unitModel} onChange={e => setUnitModel(e.target.value)} placeholder="Hiace" className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.year')}</Label>
                    <Input type="number" min="1990" max="2030" value={unitYear}
                      onChange={e => setUnitYear(e.target.value)} placeholder="2022"
                      className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.plate')}</Label>
                    <Input value={unitPlate} onChange={e => setUnitPlate(e.target.value)} placeholder="1234-ABC" className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('wemoveProfile.color')}</Label>
                    <Input value={unitColor} onChange={e => setUnitColor(e.target.value)} placeholder="Blanco" className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                </div>
                {/* Foto de la unidad — va a transport_units.photo_url, NO a wemove_transporters */}
                <DocUpload
                  label={t('wemoveProfile.vehiclePhotoUnit')} icon={Camera}
                  docKey={`unit_${editingUnitId ?? 'new'}_photo`}
                  userId={user.id}
                  bucket="transporter-docs"
                  pathPrefix={`${user.id}/units`}
                  currentUrl={unitPhotoUrl || null}
                  onUploaded={url => setUnitPhotoUrl(url)}
                />
                <button
                  onClick={handleUnitSubmit}
                  disabled={savingUnit || !unitType || !unitCapacity}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingUnit
                    ? <><Loader2 className="h-4 w-4 animate-spin" />{t('wemoveProfile.saving')}</>
                    : editingUnitId ? t('wemoveProfile.updateUnit') : t('wemoveProfile.addUnitBtn')
                  }
                </button>
              </div>
            )}
          </div>
        </Accordion>

        {/* ── Cómo funciona ── */}
        <Accordion title={t('wemoveProfile.howItWorks')} subtitle={t('wemoveProfile.howSubtitle')} icon={Share2}>
          <HowItWorksContent />
        </Accordion>
      </main>

      {/* Editor de layout de asientos */}
      {editorUnit && (
        <SeatLayoutEditor
          unitId={editorUnit.id}
          unitType={editorUnit.type}
          unitCapacity={editorUnit.capacity}
          initialLayout={editorUnit.layout}
          onSave={() => {
            setEditorUnit(null);
            qc.invalidateQueries({ queryKey: ['my-transport-units', user.id] });
            toast({ title: t('wemoveProfile.seatLayoutDone') });
          }}
          onClose={() => setEditorUnit(null)}
        />
      )}
    </div>
  );
}
