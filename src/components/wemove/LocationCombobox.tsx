// src/components/wemove/LocationCombobox.tsx
// Campo de búsqueda de ciudades con opción de crear nueva si no existe

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Location {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

interface LocationComboboxProps {
  value:       string;           // location id seleccionado
  onChange:    (id: string, name: string) => void;
  placeholder: string;
  excludeId?:  string;           // excluir esta ciudad (ej: origen cuando buscas destino)
  label?:      string;
}

export function LocationCombobox({
  value, onChange, placeholder, excludeId, label
}: LocationComboboxProps) {
  const [query, setQuery]           = useState('');
  const [open, setOpen]             = useState(false);
  const [locations, setLocations]   = useState<Location[]>([]);
  const [loading, setLoading]       = useState(false);
  const [creating, setCreating]     = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const inputRef                    = useRef<HTMLInputElement>(null);
  const containerRef                = useRef<HTMLDivElement>(null);

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

  // Buscar cuando cambia el query
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      // Sin búsqueda: mostrar primeras 10 ciudades
      supabase
        .from('locations')
        .select('id, name, type, is_active')
        .eq('type', 'city')
        .eq('is_active', true)
        .order('name')
        .limit(10)
        .then(({ data }) => setLocations(
          (data ?? []).filter(l => l.id !== excludeId)
        ));
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name, type, is_active')
        .eq('type', 'city')
        .eq('is_active', true)
        .ilike('name', `%${trimmed}%`)
        .order('name')
        .limit(8);
      setLocations((data ?? []).filter(l => l.id !== excludeId));
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, excludeId]);

  const handleSelect = (loc: Location) => {
    setSelectedName(loc.name);
    setQuery('');
    setOpen(false);
    onChange(loc.id, loc.name);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);

    // Verificar que no exista ya con ese nombre exacto
    const { data: existing } = await supabase
      .from('locations')
      .select('id, name, type, is_active')
      .eq('type', 'city')
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      // Ya existe, seleccionarla directamente
      handleSelect(existing as Location);
      setCreating(false);
      return;
    }

    // Crear nueva ciudad
    const { data: newLoc, error } = await supabase
      .from('locations')
      .insert({ name, type: 'city', is_active: true })
      .select('id, name, type, is_active')
      .single();

    setCreating(false);
    if (newLoc && !error) {
      handleSelect(newLoc as Location);
    }
  };

  const handleClear = () => {
    setSelectedName('');
    setQuery('');
    onChange('', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ¿El query no coincide con ningún resultado?
  const noMatch = query.trim().length >= 2 &&
    !loading &&
    locations.every(l => l.name.toLowerCase() !== query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
          {label}
        </label>
      )}

      {/* Input principal */}
      <div
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 cursor-text transition-colors bg-background',
          open ? 'border-primary' : 'border-foreground/30 hover:border-foreground/60',
          value ? 'border-foreground/40' : ''
        )}
      >
        <MapPin className={cn('h-4 w-4 shrink-0', value ? 'text-primary' : 'text-muted-foreground')} />

        {/* Mostrar nombre seleccionado o input de búsqueda */}
        {value && !open ? (
          <span className="flex-1 text-sm font-bold truncate">{selectedName}</span>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={value && !open ? selectedName : placeholder}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        )}

        {/* Limpiar */}
        {value && (
          <button
            onClick={e => { e.stopPropagation(); handleClear(); }}
            className="p-0.5 hover:text-foreground text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!value && (
          <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border-2 border-foreground/20 rounded-xl shadow-xl z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Buscando…
            </div>
          )}

          {!loading && locations.length === 0 && query.trim().length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Escribe para buscar una ciudad…
            </div>
          )}

          {!loading && locations.length > 0 && (
            <ul className="max-h-52 overflow-y-auto py-1">
              {locations.map(loc => (
                <li key={loc.id}>
                  <button
                    onClick={() => handleSelect(loc)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors',
                      loc.id === value ? 'bg-primary/10 font-bold text-primary' : ''
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {loc.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Opción de crear nueva ciudad */}
          {noMatch && (
            <div className="border-t border-border/60">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-primary/5 text-primary font-bold transition-colors"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {creating ? 'Agregando…' : `Agregar "${query.trim()}" como nueva ciudad`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
