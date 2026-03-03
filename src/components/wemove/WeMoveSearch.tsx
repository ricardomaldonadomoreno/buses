// src/components/wemove/WeMoveSearch.tsx — REESCRITO con LocationCombobox
import { useState } from 'react';
import { LocationCombobox } from '@/components/wemove/LocationCombobox';
import { Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface WeMoveSearchProps {
  onSearch: (originId: string, destinationId: string, date?: Date) => void;
}

export function WeMoveSearch({ onSearch }: WeMoveSearchProps) {
  const [originId,   setOriginId]   = useState('');
  const [destId,     setDestId]     = useState('');
  const [dateStr,    setDateStr]    = useState('');

  const handleSearch = () => {
    const date = dateStr ? new Date(dateStr) : undefined;
    onSearch(originId, destId, date);
  };

  return (
    <section id="search-section" className="py-10 bg-muted/30">
      <div className="container max-w-3xl">
        <h2 className="text-2xl font-black text-center mb-6">Busca tu próximo viaje</h2>

        <div className="bg-card border-4 border-foreground rounded-2xl p-5 shadow-[6px_6px_0px_0px_hsl(var(--foreground))] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LocationCombobox
              label="Origen"
              value={originId}
              onChange={(id) => setOriginId(id)}
              placeholder="¿Desde dónde sales?"
              excludeId={destId}
            />
            <LocationCombobox
              label="Destino"
              value={destId}
              onChange={(id) => setDestId(id)}
              placeholder="¿A dónde vas?"
              excludeId={originId}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Fecha (opcional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={dateStr}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDateStr(e.target.value)}
                  className="pl-9 rounded-xl border-foreground/30"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Buscar viajes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
