// src/components/wemove/LocationCombobox.tsx
// Buscador de ubicaciones con opción de crear nueva
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  MapPin, Plus, Search, X, Loader2, AlertTriangle,
  Globe, Building2, ChevronRight, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ─────────────────────────────────────────────────────
interface Location {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface Props {
  label: string;
  value: string;           // id seleccionado
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  excludeId?: string;      // para excluir el origen al elegir destino
}

// ── Formulario de nueva ubicación ─────────────────────────────
// Se muestra dentro del combobox cuando el chofer hace clic en "Agregar X"
function NewLocationForm({
  initialName,
  onCreated,   // (id, displayName) — cuando se guardó con éxito
  onCancel,
}: {
  initialName: string;
  onCreated: (id: string, name: string) => void;
  onCancel: () => void;
}) {
  const [country,  setCountry]  = useState('');
  const [region,   setRegion]   = useState('');
  const [city,     setCity]     = useState(initialName);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  // Nombre compuesto que se guarda: "País - Ciudad" o "País - Región - Ciudad"
  const buildName = () => {
    const parts = [country.trim(), region.trim(), city.trim()].filter(Boolean);
    return parts.join(' - ');
  };

  const isValid = country.trim().length >= 2 && city.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    const name = buildName();

    // Comprobar duplicados antes de insertar
    const { data: existing } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      // Ya existe — simplemente usarla
      onCreated(existing.id, existing.name);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('locations')
        .insert({ name, type: 'city', is_active: true })
        .select('id, name')
        .single();

      if (dbErr) throw dbErr;
      onCreated(data.id, data.name);
    } catch (err: any) {
      // El error más probable es RLS. Mensaje amigable.
      if (err.code === '42501' || err.message?.includes('policy')) {
        setError('Sin permiso para crear ubicaciones. Contacta al soporte.');
      } else {
        setError(err.message ?? 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = buildName();

  return (
    <div className="p-4 space-y-4">
      {/* Aviso importante */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold">⚠️ Una vez creada, esta ubicación no se podrá editar.</p>
          <p>
            Por favor sé muy específico. Usa el formato:<br />
            <span className="font-mono font-bold">País — Ciudad</span> o
            <span className="font-mono font-bold"> País — Región/Provincia — Ciudad/Lugar</span>
          </p>
          <p className="text-amber-700">
            Ejemplo: <em>Bolivia - Tarija</em> ó <em>Bolivia - Santa Cruz - Okinawa 1</em>
          </p>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-3">
        {/* País */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Globe className="h-3.5 w-3.5" /> País *
          </label>
          <input
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Ej: Bolivia, Argentina, Brasil…"
            className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Región / Provincia (opcional) */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Building2 className="h-3.5 w-3.5" /> Región / Provincia
            <span className="text-muted-foreground/60 normal-case font-normal">(opcional)</span>
          </label>
          <input
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="Ej: Santa Cruz, Tarija, Cochabamba…"
            className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Ciudad / Lugar */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <MapPin className="h-3.5 w-3.5" /> Ciudad / Lugar específico *
          </label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ej: Okinawa 1, Tartagal, El Torno…"
            className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Preview del nombre compuesto */}
      {preview && (
        <div className="bg-muted/40 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Se guardará como:</p>
            <p className="text-sm font-semibold text-foreground">{preview}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || saving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold
            hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
            : <><CheckCircle className="h-4 w-4" /> Confirmar y agregar</>
          }
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border-2 border-border rounded-xl text-sm text-muted-foreground
            hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Combobox principal ────────────────────────────────────────
export function LocationCombobox({ label, value, onChange, placeholder, excludeId }: Props) {
  const [query,       setQuery]     = useState('');
  const [open,        setOpen]      = useState(false);
  const [locations,   setLocations] = useState<Location[]>([]);
  const [loading,     setLoading]   = useState(false);
  const [creating,    setCreating]  = useState(false);   // ← muestra el formulario
  const [selected,   setSelected]   = useState<Location | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Cargar ubicaciones filtradas por query ──────────────────
  const fetchLocations = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let qb = supabase
        .from('locations')
        .select('id, name, type, is_active')
        .eq('is_active', true)
        .order('name')
        .limit(12);

      if (q.trim()) {
        qb = qb.ilike('name', `%${q.trim()}%`);
      }

      const { data, error } = await qb;
      if (!error && data) {
        setLocations(excludeId ? data.filter(l => l.id !== excludeId) : data);
      }
    } finally {
      setLoading(false);
    }
  }, [excludeId]);

  useEffect(() => {
    if (open) fetchLocations(query);
  }, [query, open, fetchLocations]);

  // ── Cargar nombre de la selección actual (cuando llega value externo) ─
  useEffect(() => {
    if (!value) { setSelected(null); setQuery(''); return; }
    if (selected?.id === value) return;
    supabase.from('locations').select('id, name, type, is_active').eq('id', value).maybeSingle()
      .then(({ data }) => { if (data) { setSelected(data); setQuery(data.name); } });
  }, [value]);

  // ── Cerrar al hacer clic fuera ──────────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        if (selected) setQuery(selected.name);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [selected]);

  const handleSelect = (loc: Location) => {
    setSelected(loc);
    setQuery(loc.name);
    setOpen(false);
    setCreating(false);
    onChange(loc.id, loc.name);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setOpen(false);
    setCreating(false);
    onChange('', '');
  };

  const handleCreated = (id: string, name: string) => {
    const loc: Location = { id, name, type: 'city', is_active: true };
    setSelected(loc);
    setQuery(name);
    setOpen(false);
    setCreating(false);
    onChange(id, name);
    // Refrescar lista local para que aparezca en futuras búsquedas
    setLocations(prev => [loc, ...prev.filter(l => l.id !== id)]);
  };

  // ¿El query no coincide exactamente con ninguna ubicación?
  const noExactMatch = query.trim().length >= 2 &&
    !locations.some(l => l.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
        {label}
      </label>

      {/* Input de búsqueda */}
      <div
        className={cn(
          'flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 bg-background transition-colors',
          open ? 'border-primary' : 'border-border/60 hover:border-foreground/40',
        )}
      >
        <MapPin className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
        <input
          type="text"
          value={query}
          placeholder={placeholder ?? 'Buscar ciudad…'}
          onFocus={() => { setOpen(true); if (selected) setQuery(''); }}
          onChange={e => { setQuery(e.target.value); setCreating(false); }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
        {selected && !loading && (
          <button type="button" onClick={handleClear} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!selected && !loading && <Search className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border-2 border-border rounded-2xl shadow-xl overflow-hidden">
          {creating ? (
            /* ── Formulario de nueva ubicación ── */
            <NewLocationForm
              initialName={query}
              onCreated={handleCreated}
              onCancel={() => { setCreating(false); }}
            />
          ) : (
            /* ── Lista de resultados ── */
            <div className="max-h-64 overflow-y-auto">
              {locations.length === 0 && !loading && query.trim().length < 2 && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                  Escribe para buscar ciudades…
                </div>
              )}
              {locations.length === 0 && !loading && query.trim().length >= 2 && !noExactMatch && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                  Sin resultados para "{query}"
                </div>
              )}
              {locations.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors',
                    value === loc.id && 'bg-primary/10 text-primary font-semibold',
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{loc.name}</span>
                  {value === loc.id && <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              ))}

              {/* Botón "Agregar nueva ciudad" */}
              {noExactMatch && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                    border-t border-border bg-primary/5 hover:bg-primary/10 transition-colors
                    text-primary font-bold"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Agregar "{query}" como nueva ciudad</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
