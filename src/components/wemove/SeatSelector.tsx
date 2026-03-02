// src/components/wemove/SeatSelector.tsx
// Selector visual de asientos tipo simulador de vehículo

import { cn } from '@/lib/utils';
import { User, X } from 'lucide-react';

interface SeatSelectorProps {
  totalSeats: number;
  takenSeats: number[];        // números de asientos ya ocupados
  selectedSeat: number | null;
  onSelect: (seat: number) => void;
  vehicleType?: string;        // 'bus' | 'minibus' | 'van' | 'coaster' etc
}

export function SeatSelector({ totalSeats, takenSeats, selectedSeat, onSelect, vehicleType = 'bus' }: SeatSelectorProps) {
  // Configuración de columnas por tipo de vehículo
  const cols = totalSeats <= 8 ? 2    // van/suv
    : totalSeats <= 20 ? 3            // minibus/coaster
    : 4;                              // bus

  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  // Agrupar en filas de `cols` asientos, con pasillo en medio
  // Layout: [A][B] | pasillo | [C][D]
  const leftCols  = cols === 4 ? 2 : cols === 3 ? 1 : 1;
  const rightCols = cols === 4 ? 2 : cols === 3 ? 2 : 1;
  const seatsPerRow = leftCols + rightCols;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  return (
    <div className="select-none">
      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-muted border-2 border-border" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-primary border-2 border-primary" />
          Tu asiento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-foreground/20 border-2 border-foreground/30" />
          Ocupado
        </span>
      </div>

      {/* Vehículo */}
      <div className="bg-muted/40 border-4 border-foreground/20 rounded-3xl p-4 max-w-xs mx-auto">
        {/* Frente del vehículo */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-foreground/20">
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
            <span className="text-[10px] font-black text-muted-foreground">🚌</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FRENTE</span>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Asientos */}
        <div className="space-y-2">
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowStart = rowIdx * seatsPerRow;
            const leftSeats  = seats.slice(rowStart, rowStart + leftCols);
            const rightSeats = seats.slice(rowStart + leftCols, rowStart + seatsPerRow);

            return (
              <div key={rowIdx} className="flex items-center gap-2 justify-center">
                {/* Asientos izquierda */}
                <div className={`flex gap-1.5`}>
                  {leftSeats.map(n => (
                    <SeatButton key={n} number={n}
                      taken={takenSeats.includes(n)}
                      selected={selectedSeat === n}
                      onSelect={onSelect} />
                  ))}
                </div>

                {/* Pasillo */}
                <div className="w-4 flex-shrink-0 flex items-center justify-center">
                  <div className="w-1 h-6 rounded bg-foreground/10" />
                </div>

                {/* Asientos derecha */}
                <div className="flex gap-1.5">
                  {rightSeats.map(n => (
                    <SeatButton key={n} number={n}
                      taken={takenSeats.includes(n)}
                      selected={selectedSeat === n}
                      onSelect={onSelect} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Parte trasera */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-foreground/20">
          <div className="flex justify-center gap-1.5">
            {/* Última fila full width si sobran asientos */}
            {Array.from({ length: Math.min(cols, totalSeats - rows * seatsPerRow + seatsPerRow) }, (_, i) => {
              const n = rows * seatsPerRow - seatsPerRow + 1 + i;
              if (n > totalSeats) return null;
              return null; // ya incluidos arriba
            })}
          </div>
          <p className="text-center text-[10px] text-muted-foreground font-bold mt-1">PARTE TRASERA</p>
        </div>
      </div>

      {/* Resumen selección */}
      {selectedSeat && (
        <div className="mt-4 flex items-center justify-center gap-2 bg-primary/10 border-2 border-primary rounded-xl py-3 px-4">
          <span className="text-sm font-black text-primary">Asiento {selectedSeat} seleccionado</span>
          <button onClick={() => onSelect(0)} className="text-primary hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function SeatButton({ number, taken, selected, onSelect }: {
  number: number; taken: boolean; selected: boolean; onSelect: (n: number) => void;
}) {
  if (taken) {
    return (
      <div className="w-9 h-9 rounded-lg bg-foreground/15 border-2 border-foreground/20 flex items-center justify-center cursor-not-allowed">
        <User className="h-3.5 w-3.5 text-foreground/30" />
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(selected ? 0 : number)}
      className={cn(
        'w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all duration-150',
        selected
          ? 'bg-primary border-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] scale-110'
          : 'bg-background border-foreground/30 text-foreground hover:border-primary hover:bg-primary/10 hover:scale-105'
      )}
    >
      {number}
    </button>
  );
}
