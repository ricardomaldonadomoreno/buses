// src/components/wemove/SeatLayoutEditor.tsx
// Editor visual de plantilla de asientos — modal
// El chofer arma su vehículo como un puzzle libre

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Save, RotateCcw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ──
export type CellType = 'empty' | 'seat' | 'fold_seat' | 'driver' | 'aisle' | 'storage';

export interface LayoutCell {
  row:    number;
  col:    number;
  type:   CellType;
  label?: string;
}

export interface SeatLayout {
  rows:  number;
  cols:  number;
  cells: LayoutCell[];
}

interface SeatLayoutEditorProps {
  unitId:       string;
  unitType:     string;
  unitCapacity: number;
  initialLayout: SeatLayout | null;
  onSave:  (layout: SeatLayout) => void;
  onClose: () => void;
}

// Ciclo de tipos al hacer clic
const TYPE_CYCLE: CellType[] = ['empty', 'seat', 'fold_seat', 'driver', 'aisle', 'storage'];

const CELL_META: Record<CellType, {
  label: string; icon: string; bg: string; border: string; text: string;
}> = {
  empty:     { label: 'Vacío',    icon: '',   bg: 'bg-transparent',           border: 'border-dashed border-foreground/10', text: 'text-transparent' },
  seat:      { label: 'Asiento',  icon: '🪑', bg: 'bg-background',             border: 'border-foreground/40',              text: 'text-foreground'  },
  fold_seat: { label: 'Plegable', icon: '⊞',  bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-dashed border-amber-400', text: 'text-amber-700'   },
  driver:    { label: 'Chofer',   icon: '🚗', bg: 'bg-primary/10',             border: 'border-primary/40',                 text: 'text-primary'     },
  aisle:     { label: 'Pasillo',  icon: '│',  bg: 'bg-muted/30',               border: 'border-foreground/10',              text: 'text-muted-foreground' },
  storage:   { label: 'Maletero',icon: '🧳', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-dashed border-blue-300', text: 'text-blue-600'    },
};

// Generar layout vacío inicial
function buildEmptyLayout(rows: number, cols: number): SeatLayout {
  const cells: LayoutCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, type: 'empty' });
    }
  }
  return { rows, cols, cells };
}

// Re-numerar asientos después de cada cambio
function renumberSeats(cells: LayoutCell[]): LayoutCell[] {
  let n = 1;
  return cells.map(cell => {
    if (cell.type === 'seat' || cell.type === 'fold_seat') {
      return { ...cell, label: String(n++) };
    }
    return { ...cell, label: undefined };
  });
}

export function SeatLayoutEditor({
  unitId, unitType, unitCapacity, initialLayout, onSave, onClose
}: SeatLayoutEditorProps) {
  const defaultRows = Math.ceil(unitCapacity / 4) + 1;
  const defaultCols = 5;

  const [rows, setRows] = useState(initialLayout?.rows ?? defaultRows);
  const [cols, setCols] = useState(initialLayout?.cols ?? defaultCols);
  const [cells, setCells] = useState<LayoutCell[]>(() => {
    if (initialLayout) return initialLayout.cells;
    return buildEmptyLayout(defaultRows, defaultCols).cells;
  });
  const [saving, setSaving] = useState(false);
  const [paintMode, setPaintMode] = useState<CellType>('seat');

  // Mapa rápido row,col → cell
  const cellMap = new Map<string, LayoutCell>();
  cells.forEach(c => cellMap.set(`${c.row},${c.col}`, c));

  const getCell = (r: number, c: number): LayoutCell =>
    cellMap.get(`${r},${c}`) ?? { row: r, col: c, type: 'empty' };

  // Click en celda → aplicar tipo seleccionado
  const handleCellClick = useCallback((row: number, col: number) => {
    setCells(prev => {
      const updated = prev.map(c =>
        c.row === row && c.col === col ? { ...c, type: paintMode } : c
      );
      // Si no existía la celda, agregarla
      if (!prev.find(c => c.row === row && c.col === col)) {
        updated.push({ row, col, type: paintMode });
      }
      return renumberSeats(updated);
    });
  }, [paintMode]);

  // Resize grid
  const resizeGrid = (newRows: number, newCols: number) => {
    const newCells: LayoutCell[] = [];
    for (let r = 0; r < newRows; r++) {
      for (let c = 0; c < newCols; c++) {
        const existing = cellMap.get(`${r},${c}`);
        newCells.push(existing ?? { row: r, col: c, type: 'empty' });
      }
    }
    setRows(newRows);
    setCols(newCols);
    setCells(renumberSeats(newCells));
  };

  const handleReset = () => {
    setCells(renumberSeats(buildEmptyLayout(rows, cols).cells));
  };

  const seatCount = cells.filter(c => c.type === 'seat' || c.type === 'fold_seat').length;

  const handleSave = async () => {
    const layout: SeatLayout = { rows, cols, cells };
    setSaving(true);
    const { error } = await supabase
      .from('transport_units')
      .update({ seat_layout: layout as any })
      .eq('id', unitId);
    setSaving(false);
    if (!error) onSave(layout);
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border-4 border-foreground rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-foreground/10 shrink-0">
          <div>
            <h2 className="text-xl font-black">Diseña tu vehículo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unitType} · {seatCount} asientos vendibles
              {seatCount !== unitCapacity && (
                <span className="text-amber-500 ml-1">
                  (capacidad registrada: {unitCapacity})
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 overflow-hidden flex-1 min-h-0">

          {/* ── Panel izquierdo: controles ── */}
          <div className="lg:w-56 shrink-0 border-b-2 lg:border-b-0 lg:border-r-2 border-foreground/10 p-4 space-y-5 overflow-y-auto">

            {/* Tamaño de grilla */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tamaño</p>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold">Filas</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => rows > 1 && resizeGrid(rows - 1, cols)}
                    className="w-7 h-7 border-2 border-foreground rounded-lg font-black text-sm hover:bg-muted">−</button>
                  <span className="w-8 text-center font-black">{rows}</span>
                  <button onClick={() => rows < 15 && resizeGrid(rows + 1, cols)}
                    className="w-7 h-7 border-2 border-foreground rounded-lg font-black text-sm hover:bg-muted">+</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold">Columnas</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => cols > 1 && resizeGrid(rows, cols - 1)}
                    className="w-7 h-7 border-2 border-foreground rounded-lg font-black text-sm hover:bg-muted">−</button>
                  <span className="w-8 text-center font-black">{cols}</span>
                  <button onClick={() => cols < 8 && resizeGrid(rows, cols + 1)}
                    className="w-7 h-7 border-2 border-foreground rounded-lg font-black text-sm hover:bg-muted">+</button>
                </div>
              </div>
            </div>

            {/* Pincel — tipo de celda */}
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pincel</p>
              <div className="space-y-1.5">
                {(Object.keys(CELL_META) as CellType[]).map(type => {
                  const m = CELL_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setPaintMode(type)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all text-left',
                        paintMode === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/40'
                      )}
                    >
                      <span className="text-base leading-none w-5 text-center">{m.icon || '○'}</span>
                      {m.label}
                      {paintMode === type && <span className="ml-auto text-[10px] font-black text-primary">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="bg-muted/40 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Info className="h-3 w-3" /> Instrucciones
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Selecciona un tipo de celda y haz clic en las celdas para pintar. Los asientos se numeran automáticamente.
              </p>
            </div>

            {/* Reset */}
            <button onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 border-2 border-foreground/30 rounded-xl py-2 text-xs font-bold text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> Limpiar todo
            </button>
          </div>

          {/* ── Panel derecho: grilla ── */}
          <div className="flex-1 overflow-auto p-4">
            {/* Indicador frente */}
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-dashed border-foreground/15">
              ▲ FRENTE DEL VEHÍCULO
            </div>

            {/* Grid */}
            <div
              className="inline-grid gap-1.5 mx-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 44px)` }}
            >
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const cell = getCell(r, c);
                  const meta = CELL_META[cell.type];
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      title={meta.label}
                      className={cn(
                        'w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-100',
                        'hover:scale-110 hover:z-10 active:scale-95',
                        meta.bg, meta.border,
                        // Resaltar si el pincel actual coincide
                        paintMode === cell.type && 'ring-2 ring-primary ring-offset-1'
                      )}
                    >
                      {cell.type === 'empty' ? (
                        <span className="text-foreground/10 text-lg">·</span>
                      ) : cell.type === 'aisle' ? (
                        <span className="text-foreground/20 text-lg">│</span>
                      ) : (
                        <>
                          {(cell.type === 'seat' || cell.type === 'fold_seat') && cell.label ? (
                            <span className={cn('text-[11px] font-black leading-none', meta.text)}>
                              {cell.label}
                            </span>
                          ) : (
                            <span className="text-base leading-none">{meta.icon}</span>
                          )}
                          {cell.type === 'fold_seat' && (
                            <span className="text-[8px] text-amber-500 leading-none">pleg</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Indicador trasera */}
            <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-3 pt-2 border-t border-dashed border-foreground/15">
              ▼ PARTE TRASERA
            </div>
          </div>
        </div>

        {/* Footer — guardar */}
        <div className="px-6 py-4 border-t-2 border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <div className="text-sm">
            <span className="font-black text-primary text-lg">{seatCount}</span>
            <span className="text-muted-foreground ml-1">asientos vendibles</span>
            {cells.filter(c => c.type === 'fold_seat').length > 0 && (
              <span className="text-amber-500 text-xs ml-2">
                ({cells.filter(c => c.type === 'fold_seat').length} plegables)
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 border-2 border-foreground/30 rounded-xl font-bold text-sm hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || seatCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black text-sm rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                : <><Save className="h-4 w-4" />Guardar plantilla</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
