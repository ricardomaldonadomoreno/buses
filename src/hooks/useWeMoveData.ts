import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  name: string;
  type: 'country' | 'city' | 'terminal';
  parent_id: string | null;
  is_active: boolean;
}

export interface WeMoveRoute {
  id: string;
  transporter_id: string;
  transport_unit_id: string;
  route_id: string;
  departure_time: string;
  available_seats: number;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
  transporter?: { full_name: string; rating: number };
  route?: { origin: Location; destination: Location };
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useWeMoveRoutes(originId?: string, destinationId?: string, date?: Date) {
  return useQuery({
    queryKey: ['wemove-routes', originId, destinationId, date?.toISOString()],
    enabled: !!(originId && destinationId), // ← solo busca cuando hay origen Y destino
    queryFn: async () => {
      // ── Query directa sin pasos intermedios ──────────────────
      // Une wemove_routes con routes en un solo query para evitar
      // problemas de RLS en la tabla routes
      let query = supabase
        .from('wemove_routes')
        .select(`
          *,
          profiles:transporter_id (full_name, rating),
          routes:route_id (
            id,
            origin_location_id,
            destination_location_id,
            origin:origin_location_id (id, name, type, parent_id, is_active),
            destination:destination_location_id (id, name, type, parent_id, is_active)
          )
        `)
        .eq('status', 'active')
        .gt('available_seats', 0);  // ← solo viajes con asientos libres

      // Filtro de fecha: si hay fecha busca ese día, sino busca desde ahora
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query = query
          .gte('departure_time', start.toISOString())
          .lte('departure_time', end.toISOString());
      } else {
        // Sin fecha: muestra próximos 30 días
        const now = new Date();
        const in30 = new Date();
        in30.setDate(now.getDate() + 30);
        query = query
          .gte('departure_time', now.toISOString())
          .lte('departure_time', in30.toISOString());
      }

      query = query.order('departure_time');

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Filtrar por origen y destino en memoria (más simple y confiable)
      return data
        .filter(item => {
          const r = item.routes as any;
          if (!r) return false;
          const matchOrigin      = r.origin_location_id === originId;
          const matchDestination = r.destination_location_id === destinationId;
          return matchOrigin && matchDestination;
        })
        .map(item => ({
          id:               item.id,
          transporter_id:   item.transporter_id,
          transport_unit_id: item.transport_unit_id,
          route_id:         item.route_id,
          departure_time:   item.departure_time,
          available_seats:  item.available_seats,
          price:            item.price,
          status:           item.status,
          transporter: (item.profiles as any) ? {
            full_name: (item.profiles as any).full_name || 'Transportador',
            rating:    (item.profiles as any).rating    || 0,
          } : undefined,
          route: (item.routes as any) ? {
            origin:      (item.routes as any).origin,
            destination: (item.routes as any).destination,
          } : undefined,
        })) as WeMoveRoute[];
    },
  });
}
