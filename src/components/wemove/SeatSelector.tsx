// src/components/wemove/SeatSelector.tsx
// Renderiza el layout libre definido por el chofer.
// Si no hay layout guardado, cae en fallback de cuadrícula simple.

import { cn } from '@/lib/utils';

// ── Tipos del JSON guardado en transport_units.seat_layout ──
export type CellType = 'seat' | 'driver' | 'aisle' | 'empty' | 'storage' | 'fold_seat';

export interface LayoutCell {
  row:   number;
  col:   number;
  type:  CellType;
  label?: string;  // número o letra del asiento, ej "1", "2A"
}

export interface SeatLayout {
  rows:  number;
  cols:  number;
  cells: LayoutCell[];
}

interface SeatSelectorProps {
  layout:       SeatLayout | null;   // JSON del chofer — null = fallback
  totalSeats:   number;              // usado solo en fallback
  takenSeats:   string[];            // labels de asientos ocupados, ej ["1","3","5A"]
  selectedSeat: string | null;       // label del asiento seleccionado
  onSelect:     (label: string | null) => void;
}

// ── Iconos / apariencia por tipo de celda ──
const CELL_CONFIG: Record<CellType, { bg: string; label: string; clickable: boolean }> = {
  seat:      { bg: '',          label: '',        clickable: true  },
  fold_seat: { bg: '',          label: '',        clickable: true  },
  driver:    { bg: 'bg-muted/60 border-foreground/20', label: '🚗', clickable: false },
  aisle:     { bg: 'bg-transparent border-0',          label: '',   clickable: false },
  empty:     { bg: 'bg-transparent border-0',          label: '',   clickable: false },
  storage:   { bg: 'bg-muted/40 border-dashed border-foreground/20', label: '🧳', clickable: false },
};

export function SeatSelector({ layout, totalSeats, takenSeats, selectedSeat, onSelect }: SeatSelectorProps) {
  // Si el chofer definió un layout, usarlo; si no, generar fallback simple
  const resolvedLayout = layout ?? buildFallbackLayout(totalSeats);

  // Construir grilla: map[row][col] = cell
  const grid: Record<number, Record<number, LayoutCell>> = {};
  for (const cell of resolvedLayout.cells) {
    if (!grid[cell.row]) grid[cell.row] = {};
    grid[cell.row][cell.col] = cell;
  }

  const seatLabels = resolvedLayout.cells
    .filter(c => c.type === 'seat' || c.type === 'fold_seat')
    .map(c => c.label ?? String(c.row * resolvedLayout.cols + c.col + 1));

  const available = seatLabels.length - takenSeats.length;

  return (
    <div className="select-none space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        <LegendItem color="bg-background border-2 border-foreground/30" label="Libre" />
        <LegendItem color="bg-primary border-2 border-primary" label="Tu asiento" textColor="text-primary-foreground" />
        <LegendItem color="bg-foreground/20 border-2 border-foreground/30" label="Ocupado" />
        <LegendItem color="bg-muted border-dashed border-2 border-foreground/20" label="Plegable" />
      </div>

      {/* Resumen */}
      <p className="text-xs text-muted-foreground">
        {takenSeats.length} ocupados · <span className="font-bold text-foreground">{available} disponibles</span>
      </p>

      {/* Vehículo */}
      <div className="bg-muted/20 border-4 border-foreground/15 rounded-3xl p-4 overflow-x-auto">
        <div className="min-w-fit mx-auto" style={{ width: `${resolvedLayout.cols * 44 + 24}px` }}>

          {/* Frente */}
          <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b-2 border-dashed border-foreground/15">
            ▲ FRENTE
          </div>

          {/* Filas */}
          <div className="space-y-1.5">
            {Array.from({ length: resolvedLayout.rows }, (_, rowIdx) => (
              <div key={rowIdx} className="flex gap-1.5 justify-center">
                {Array.from({ length: resolvedLayout.cols }, (_, colIdx) => {
                  const cell = grid[rowIdx]?.[colIdx];
                  // Celda vacía si no está definida
                  if (!cell) return <div key={colIdx} className="w-10 h-10" />;
                  return (
                    <SeatCell
                      key={`${rowIdx}-${colIdx}`}
                      cell={cell}
                      taken={takenSeats.includes(cell.label ?? '')}
                      selected={selectedSeat === (cell.label ?? '')}
                      onSelect={() => {
                        if (cell.type !== 'seat' && cell.type !== 'fold_seat') return;
                        const lbl = cell.label ?? '';
                        onSelect(selectedSeat === lbl ? null : lbl);
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Parte trasera */}
          <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-3 pt-2 border-t-2 border-dashed border-foreground/15">
            ▼ PARTE TRASERA
          </div>
        </div>
      </div>

      {/* Asiento seleccionado */}
      {selectedSeat && (
        <div className="flex items-center justify-between bg-primary/10 border-2 border-primary rounded-xl px-4 py-3">
          <span className="text-sm font-black text-primary">Asiento {selectedSeat} seleccionado</span>
          <button onClick={() => onSelect(null)} className="text-xs text-primary underline font-bold">
            Cambiar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Celda individual ──
function SeatCell({ cell, taken, selected, onSelect }: {
  cell: LayoutCell; taken: boolean; selected: boolean; onSelect: () => void;
}) {
  const cfg = CELL_CONFIG[cell.type];
  const label = cell.label ?? '';

  // No interactivo
  if (!cfg.clickable) {
    return (
      <div className={cn(
        'w-10 h-10 rounded-lg border flex items-center justify-center text-xs',
        cfg.bg
      )}>
        {cfg.label}
      </div>
    );
  }

  // Ocupado
  if (taken) {
    return (
      <div className="w-10 h-10 rounded-lg bg-foreground/15 border-2 border-foreground/20 flex items-center justify-center text-[10px] font-bold text-foreground/30 cursor-not-allowed">
        {label}
      </div>
    );
  }

  // Plegable libre
  const isFold = cell.type === 'fold_seat';

  return (
    <button
      onClick={onSelect}
      title={isFold ? `Asiento ${label} (plegable)` : `Asiento ${label}`}
      className={cn(
        'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all duration-150 relative',
        selected
          ? 'bg-primary border-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] scale-110 z-10'
          : isFold
          ? 'bg-background border-dashed border-foreground/40 text-foreground hover:border-primary hover:bg-primary/10'
          : 'bg-background border-foreground/30 text-foreground hover:border-primary hover:bg-primary/10 hover:scale-105'
      )}
    >
      {label}
      {isFold && !selected && (
        <span className="absolute -top-1 -right-1 text-[8px] leading-none">⊞</span>
      )}
    </button>
  );
}

function LegendItem({ color, label, textColor = '' }: { color: string; label: string; textColor?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('w-5 h-5 rounded', color, textColor)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

// ── Fallback: si el chofer no ha definido layout todavía ──
// Genera una cuadrícula simple 2+aisle+2 (estilo bus estándar)
function buildFallbackLayout(totalSeats: number): SeatLayout {
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow) + 1; // +1 para fila del chofer
  const cols = 5; // [A][B][pasillo][C][D]
  const cells: LayoutCell[] = [];

  // Fila 0: chofer
  cells.push({ row: 0, col: 0, type: 'driver' });
  cells.push({ row: 0, col: 1, type: 'empty' });
  cells.push({ row: 0, col: 2, type: 'aisle' });
  cells.push({ row: 0, col: 3, type: 'empty' });
  cells.push({ row: 0, col: 4, type: 'empty' });

  let seatNum = 1;
  for (let r = 1; r < rows && seatNum <= totalSeats; r++) {
    // Col 0
    if (seatNum <= totalSeats) cells.push({ row: r, col: 0, type: 'seat', label: String(seatNum++) });
    // Col 1
    if (seatNum <= totalSeats) cells.push({ row: r, col: 1, type: 'seat', label: String(seatNum++) });
    // Pasillo
    cells.push({ row: r, col: 2, type: 'aisle' });
    // Col 3
    if (seatNum <= totalSeats) cells.push({ row: r, col: 3, type: 'seat', label: String(seatNum++) });
    // Col 4
    if (seatNum <= totalSeats) cells.push({ row: r, col: 4, type: 'seat', label: String(seatNum++) });
  }

  return { rows, cols, cells };
}
