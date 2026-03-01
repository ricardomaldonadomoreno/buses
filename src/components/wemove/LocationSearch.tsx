// src/components/wemove/LocationSearch.tsx
// Autocomplete inteligente de ubicaciones con opción de crear nueva
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Search, Loader2, CheckCircle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationResult {
  id: string;
  name: string;
  state_name: string | null;
  country_code: string | null;
  display_name: string | null;
  verified: boolean;
}

// Flags por código de país
const FLAG: Record<string, string> = {
  BO: '🇧🇴', BR: '🇧🇷', PY: '🇵🇾', AR: '🇦🇷',
  PE: '🇵🇪', CL: '🇨🇱', CO: '🇨🇴', VE: '🇻🇪',
  UY: '🇺🇾', EC: '🇪🇨',
};

interface CreateLocationModalProps {
  searchText: string;
  onCreated: (loc: LocationResult) => void;
  onClose: () => void;
}

function CreateLocationModal({ searchText, onCreated, onClose }: CreateLocationModalProps) {
  const [name, setName]         = useState(searchText);
  const [state, setState]       = useState('');
  const [country, setCountry]   = useState('BO');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const COUNTRIES = [
    { code: 'BO', label: '🇧🇴 Bolivia' },
    { code: 'BR', label: '🇧🇷 Brasil' },
    { code: 'PY', label: '🇵🇾 Paraguay' },
    { code: 'AR', label: '🇦🇷 Argentina' },
    { code: 'PE', label: '🇵🇪 Perú' },
    { code: 'CL', label: '🇨🇱 Chile' },
    { code: 'CO', label: '🇨🇴 Colombia' },
    { code: 'VE', label: '🇻🇪 Venezuela' },
    { code: 'UY', label: '🇺🇾 Uruguay' },
    { code: 'EC', label: '🇪🇨 Ecuador' },
  ];

  const handleCreate = async () => {
    if (!name.trim()) { setError('El nombre de la ciudad es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error: err } = await supabase
        .from('locations')
        .insert({
          name:         name.trim(),
          state_name:   state.trim() || null,
          country_code: country,
          type:         'city',
          is_active:    true,
          verified:     false,
          created_by:   user?.id ?? null,
        })
        .select()
        .single();
      if (err) {
        if (err.code === '23505') setError('Esta ubicación ya existe');
        else setError(err.message);
        return;
      }
      onCreated(data as LocationResult);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Agregar nueva ubicación</h3>
            <p className="text-xs text-muted-foreground">Quedará disponible para todos los usuarios</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Ciudad / Comunidad *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: San Matías"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Departamento / Estado / Provincia</label>
            <input value={state} onChange={e => setState(e.target.value)}
              placeholder="Ej: Santa Cruz"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">País *</label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

interface LocationSearchProps {
  placeholder: string;
  value: LocationResult | null;
  onChange: (loc: LocationResult | null) => void;
  excludeId?: string;
  pinColor?: 'primary' | 'destructive';
  label?: string;
}

export function LocationSearch({
  placeholder, value, onChange, excludeId, pinColor = 'primary', label
}: LocationSearchProps) {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<LocationResult[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar con debounce
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('search_locations', {
          search_text: query,
          max_results: 8,
        });
        const filtered = (data as LocationResult[] ?? []).filter(l => l.id !== excludeId);
        setResults(filtered);
        setOpen(true);
      } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, excludeId]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (loc: LocationResult) => {
    onChange(loc);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const pinClass = pinColor === 'destructive' ? 'text-destructive' : 'text-primary';

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1 pl-1">
          {label}
        </label>
      )}

      {/* Selected value display */}
      {value ? (
        <div className="flex items-center gap-2 h-12 px-3 border-2 border-foreground bg-background rounded-none cursor-pointer"
          onClick={handleClear}>
          <MapPin className={cn('h-4 w-4 shrink-0', pinClass)} />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm truncate block">
              {FLAG[value.country_code ?? ''] ?? '📍'} {value.name}
            </span>
            {value.state_name && (
              <span className="text-xs text-muted-foreground truncate block leading-none">
                {value.state_name}
              </span>
            )}
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); handleClear(); }}
            className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0 ml-1">×</button>
        </div>
      ) : (
        <div className="relative">
          <MapPin className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none', pinClass)} />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-10" />}
          {!loading && query.length >= 2 && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder={placeholder}
            className="w-full h-12 pl-9 pr-9 border-2 border-foreground bg-background font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground placeholder:font-normal"
          />
        </div>
      )}

      {/* Dropdown */}
      {open && !value && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map(loc => (
                <button key={loc.id} type="button"
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-0">
                  <span className="text-xl shrink-0">{FLAG[loc.country_code ?? ''] ?? '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{loc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[loc.state_name, loc.country_code].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {loc.verified && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                </button>
              ))}
              {/* Option to create if not found */}
              <button type="button" onClick={() => { setOpen(false); setShowCreate(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors text-primary border-t border-border">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">No encuentro mi ciudad — agregar "{query}"</span>
              </button>
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No se encontró "{query}"</p>
              <button type="button" onClick={() => { setOpen(false); setShowCreate(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Agregar esta ubicación
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateLocationModal
          searchText={query}
          onCreated={loc => { handleSelect(loc); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
