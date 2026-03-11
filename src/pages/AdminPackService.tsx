// src/pages/AdminPackService.tsx — PANEL PACKSERVICE (placeholder)
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';

export default function AdminPackService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <Package className="h-8 w-8 text-amber-400" />
      </div>
      <h1 className="text-2xl font-bold text-white">PackService Admin</h1>
      <p className="text-zinc-500 text-sm mt-2 max-w-xs">El panel de administración de PackService está en construcción.</p>
      <span className="mt-3 text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full">Próximamente</span>
      <button onClick={() => navigate('/admin')}
        className="mt-8 flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al backoffice
      </button>
    </div>
  );
}
