import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWeMoveAuth } from '@/hooks/useWeMoveAuth';
import { useToast } from '@/hooks/use-toast';
import { useMyProfile, useMyUserData, useMyTransportUnits, useMyWeMoveTransporter, useUpdateProfile, useUpsertTransportUnit, useDeleteTransportUnit } from '@/hooks/useWeMoveTransporter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Pencil, Trash2, Bus, CheckCircle, Clock,
  Upload, FileText, Camera, Car, Shield, AlertCircle, Loader2,
  X, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VEHICLE_TYPES = ['bus','microbus','van','minibus','coaster','sedan','suv','boat','plane'];
const VEHICLE_LABELS: Record<string,string> = {
  bus:'Bus', microbus:'Microbus', van:'Van', minibus:'Minibus',
  coaster:'Coaster', sedan:'Sedan', suv:'SUV', boat:'Lancha/Bote', plane:'Avioneta'
};

// ── Document upload hook ───────────────────────────────────────
function useTransporterDocs(userId?: string) {
  return useQuery({
    queryKey: ['transporter-docs', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('wemove_transporters')
        .select('id_card_url, license_url, selfie_url, vehicle_photo_url, verification_status, documents_submitted, submitted_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// ── Document upload component ─────────────────────────────────
function DocUpload({ label, icon: Icon, docKey, userId, currentUrl, onUploaded }: {
  label: string; icon: React.ElementType; docKey: string;
  userId: string; currentUrl?: string | null; onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'El archivo es muy grande (máx. 10MB)', variant: 'destructive' }); return;
    }

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `${userId}/${docKey}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('transporter-docs')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('transporter-docs')
        .getPublicUrl(path);

      // Save URL to wemove_transporters
      await supabase.from('wemove_transporters').update({
        [`${docKey}_url`]: publicUrl
      }).eq('user_id', userId);

      setPreview(URL.createObjectURL(file));
      onUploaded(publicUrl);
      toast({ title: 'Documento subido correctamente' });
    } catch (err: any) {
      toast({ title: 'Error al subir documento', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
          preview
            ? 'border-green-400 bg-green-50/5'
            : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Subiendo…</p>
          </div>
        ) : preview ? (
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-green-700">Documento subido</p>
              <p className="text-xs text-muted-foreground">Clic para reemplazar</p>
            </div>
            <a href={preview} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-primary underline flex items-center gap-1">
              <Eye className="h-3 w-3" /> Ver
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <Upload className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">JPG, PNG o PDF · máx. 10MB</p>
            <p className="text-xs font-medium text-primary">Subir archivo</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function WeMoveCompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useWeMoveAuth();
  const qc = useQueryClient();

  const { data: profile }      = useMyProfile(user?.id);
  const { data: userData }     = useMyUserData(user?.id);
  const { data: units = [], isLoading: unitsLoading } = useMyTransportUnits(user?.id);
  const { data: transporter }  = useMyWeMoveTransporter(user?.id);
  const { data: docs }         = useTransporterDocs(user?.id);

  const updateProfile   = useUpdateProfile();
  const upsertUnit      = useUpsertTransportUnit();
  const deleteUnit      = useDeleteTransportUnit();

  const [fullName, setFullName]       = useState('');
  const [savingProfile, setSaving]    = useState(false);
  const [showUnitForm, setShowUnit]   = useState(false);
  const [editingUnitId, setEditUnit]  = useState<string | null>(null);
  const [unitType, setUnitType]       = useState('');
  const [unitCapacity, setUnitCapacity] = useState('');
  const [savingUnit, setSavingUnit]   = useState(false);
  const [submittingDocs, setSubmDocs] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/wemove/register');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (userData) {
      setFullName([userData.first_name, userData.last_name].filter(Boolean).join(' '));
    }
  }, [profile, userData]);

  const handleSaveProfile = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ userId: user.id, fullName: fullName.trim() });
      // Also update users table first_name/last_name
      const parts = fullName.trim().split(' ');
      await supabase.from('users').update({
        first_name: parts[0] ?? null,
        last_name:  parts.slice(1).join(' ') || null,
      }).eq('id', user.id);
      toast({ title: 'Perfil actualizado' });
    } catch {
      toast({ title: 'Error al guardar perfil', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnitSubmit = async () => {
    if (!user || !unitType || !unitCapacity) return;
    const cap = parseInt(unitCapacity);
    if (isNaN(cap) || cap < 1) { toast({ title: 'Capacidad inválida', variant: 'destructive' }); return; }
    setSavingUnit(true);
    try {
      await upsertUnit.mutateAsync({ unitId: editingUnitId ?? undefined, transporterId: user.id, type: unitType, capacity: cap });
      toast({ title: editingUnitId ? 'Unidad actualizada' : 'Unidad agregada' });
      setShowUnit(false); setEditUnit(null); setUnitType(''); setUnitCapacity('');
    } catch {
      toast({ title: 'Error al guardar unidad', variant: 'destructive' });
    } finally {
      setSavingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!user || !confirm('¿Eliminar esta unidad?')) return;
    try {
      await deleteUnit.mutateAsync({ unitId, userId: user.id });
      toast({ title: 'Unidad eliminada' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleEditUnit = (unit: any) => {
    setEditUnit(unit.id); setUnitType(unit.type);
    setUnitCapacity(unit.capacity.toString()); setShowUnit(true);
  };

  const handleSubmitForVerification = async () => {
    if (!user) return;
    if (!docs?.id_card_url) {
      toast({ title: 'Sube tu carnet de identidad antes de enviar', variant: 'destructive' }); return;
    }
    setSubmDocs(true);
    try {
      await supabase.from('wemove_transporters').update({
        documents_submitted: true,
        submitted_at: new Date().toISOString(),
        verification_status: 'pending',
      }).eq('user_id', user.id);

      // Log in verification history
      await supabase.from('verification_history').insert({
        transporter_id: transporter?.id,
        action: 'submitted',
        performed_by: user.id,
        notes: 'Documentos enviados para verificación',
      });

      qc.invalidateQueries({ queryKey: ['my-wemove-transporter'] });
      qc.invalidateQueries({ queryKey: ['transporter-docs'] });
      toast({ title: '✅ Documentos enviados para verificación', description: 'El equipo de BUSES revisará tu información.' });
    } catch (err: any) {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    } finally {
      setSubmDocs(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return null;

  const isVerified  = transporter?.verification_status === 'verified';
  const isPending   = transporter?.verification_status === 'pending';
  const isSubmitted = docs?.documents_submitted;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="container flex h-16 items-center justify-between">
          <Link to="/wemove/dashboard" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="BUSES" className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity" />
            <span className="font-serif text-lg font-semibold hidden sm:block">We<span className="text-primary">Move</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={async () => { await signOut(); navigate('/wemove'); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8 max-w-2xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Mi perfil WeMove</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tu información y unidades de transporte</p>
        </div>

        {/* VERIFICATION STATUS BANNER */}
        {isVerified ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Transportador verificado</p>
              <p className="text-xs text-green-700">Tu identidad ha sido confirmada por el equipo de BUSES.</p>
            </div>
          </div>
        ) : isSubmitted ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Documentos en revisión</p>
              <p className="text-xs text-blue-700">El equipo de BUSES está revisando tu información. Te notificaremos por email.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Verificación pendiente</p>
              <p className="text-xs text-amber-700 mt-0.5">Sube tus documentos de identidad para ser verificado. Esto genera confianza en los pasajeros y protege a todos en caso de incidentes.</p>
            </div>
          </div>
        )}

        {/* PERSONAL INFO */}
        <section className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Información personal</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Correo electrónico</Label>
              <Input value={user.email ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <Input value={userData?.first_name ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Apellido</Label>
                <Input value={userData?.last_name ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Documento</Label>
              <Input value={userData?.document_number ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <Input value={userData?.phone_full ?? ''} disabled className="mt-1.5 rounded-xl border-border/40 bg-muted/30 text-muted-foreground text-sm" placeholder="—" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Nombre visible para pasajeros</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Como quieres que te vean los pasajeros"
                  className="rounded-xl border-border/60 flex-1" />
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Este nombre verán los pasajeros al buscar tu ruta</p>
            </div>
          </div>
        </section>

        {/* VERIFICATION DOCUMENTS */}
        <section className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Documentos de verificación</h2>
              <p className="text-xs text-muted-foreground">Requeridos para operar en WeMove</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DocUpload
                label="Carnet de identidad (ambos lados) *"
                icon={FileText}
                docKey="id_card"
                userId={user.id}
                currentUrl={docs?.id_card_url}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['transporter-docs'] })}
              />
              <DocUpload
                label="Licencia de conducir"
                icon={Car}
                docKey="license"
                userId={user.id}
                currentUrl={docs?.license_url}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['transporter-docs'] })}
              />
              <DocUpload
                label="Selfie sosteniendo tu carnet"
                icon={Camera}
                docKey="selfie"
                userId={user.id}
                currentUrl={docs?.selfie_url}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['transporter-docs'] })}
              />
              <DocUpload
                label="Foto del vehículo (exterior)"
                icon={Car}
                docKey="vehicle_photo"
                userId={user.id}
                currentUrl={docs?.vehicle_photo_url}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['transporter-docs'] })}
              />
            </div>

            {!isVerified && !isSubmitted && (
              <button
                onClick={handleSubmitForVerification}
                disabled={submittingDocs || !docs?.id_card_url}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {submittingDocs
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                  : <><Shield className="h-4 w-4" /> Enviar documentos para verificación</>
                }
              </button>
            )}

            {!docs?.id_card_url && !isSubmitted && (
              <p className="text-xs text-amber-600 text-center">* El carnet de identidad es obligatorio para enviar</p>
            )}
            {isSubmitted && !isVerified && (
              <p className="text-xs text-blue-600 text-center flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Enviado el {docs.submitted_at ? new Date(docs.submitted_at).toLocaleDateString('es-BO') : '—'} · En revisión
              </p>
            )}
          </div>
        </section>

        {/* TRANSPORT UNITS */}
        <section className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bus className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">Mis unidades de transporte</h2>
            </div>
            <button onClick={() => { setShowUnit(true); setEditUnit(null); setUnitType(''); setUnitCapacity(''); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors min-h-[36px]">
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          <div className="p-5 space-y-3">
            {unitsLoading ? (
              <div className="h-16 bg-muted/30 rounded-xl animate-pulse" />
            ) : units.length === 0 && !showUnitForm ? (
              <div className="text-center py-8">
                <Bus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin unidades registradas</p>
                <button onClick={() => setShowUnit(true)}
                  className="mt-3 text-xs text-primary font-medium underline underline-offset-2">
                  Agregar mi primer vehículo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {units.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-background">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {unit.type === 'sedan' ? '🚗' : unit.type === 'suv' ? '🚙' : unit.type === 'boat' ? '⛵' : unit.type === 'plane' ? '✈️' : '🚐'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold capitalize">{VEHICLE_LABELS[unit.type] ?? unit.type}</p>
                        <p className="text-xs text-muted-foreground">{unit.capacity} asientos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unit.verified
                        ? <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Verificado</span>
                        : <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="h-3 w-3" /> Pendiente</span>
                      }
                      <button onClick={() => handleEditUnit(unit)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteUnit(unit.id)}
                        className="w-8 h-8 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unit form */}
            {showUnitForm && (
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{editingUnitId ? 'Editar unidad' : 'Nueva unidad'}</p>
                  <button onClick={() => { setShowUnit(false); setEditUnit(null); }}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo de vehículo</Label>
                    <Select value={unitType} onValueChange={setUnitType}>
                      <SelectTrigger className="mt-1.5 rounded-xl border-border/60">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{VEHICLE_LABELS[t] ?? t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Capacidad (asientos)</Label>
                    <Input type="number" min="1" max="60" value={unitCapacity}
                      onChange={e => setUnitCapacity(e.target.value)}
                      placeholder="Ej: 15"
                      className="mt-1.5 rounded-xl border-border/60" />
                  </div>
                </div>
                <button onClick={handleUnitSubmit} disabled={savingUnit || !unitType || !unitCapacity}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingUnit ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : editingUnitId ? 'Actualizar unidad' : 'Agregar unidad'}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
