// src/hooks/useWeMoveData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  name: string;
  type: 'country' | 'city' | 'terminal';
  parent_id: string | null;
  is_active: boolean;
  country_code?: string | null;
  state_name?: string | null;
  display_name?: string | null;
  verified?: boolean;
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
  // NUEVO
  vehicle_type?:  string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?:  number;
  vehicle_photo?: string;
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
    enabled: !!(originId && destinationId),
    queryFn: async () => {
      let query = supabase
        .from('wemove_routes')
        .select(`
          *,
          profiles:transporter_id (full_name, rating),
          transport_units:transport_unit_id (type, brand, model, year, photo_url),
          routes:route_id (
            id,
            origin_location_id,
            destination_location_id,
            origin:origin_location_id (id, name, type, country_code, state_name, display_name),
            destination:destination_location_id (id, name, type, country_code, state_name, display_name)
          )
        `)
        .eq('status', 'active')
        .gt('available_seats', 0);

      if (date) {
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end   = new Date(date); end.setHours(23, 59, 59, 999);
        query = query.gte('departure_time', start.toISOString()).lte('departure_time', end.toISOString());
      } else {
        const now  = new Date();
        const in30 = new Date(); in30.setDate(now.getDate() + 30);
        query = query.gte('departure_time', now.toISOString()).lte('departure_time', in30.toISOString());
      }

      const { data, error } = await query.order('departure_time');
      if (error) throw error;
      if (!data) return [];

      return data
        .filter(item => {
          const r = item.routes as any;
          if (!r) return false;
          return r.origin_location_id === originId && r.destination_location_id === destinationId;
        })
        .map(item => ({
          id: item.id,
          transporter_id: item.transporter_id,
          transport_unit_id: item.transport_unit_id,
          route_id: item.route_id,
          departure_time: item.departure_time,
          available_seats: item.available_seats,
          price: item.price,
          status: item.status,
          // NUEVO: mapear campos del vehículo
          vehicle_type:  (item.transport_units as any)?.type      ?? undefined,
          vehicle_brand: (item.transport_units as any)?.brand     ?? undefined,
          vehicle_model: (item.transport_units as any)?.model     ?? undefined,
          vehicle_year:  (item.transport_units as any)?.year      ?? undefined,
          vehicle_photo: (item.transport_units as any)?.photo_url ?? undefined,
          transporter: (item.profiles as any)
            ? { full_name: (item.profiles as any).full_name || 'Transportador', rating: (item.profiles as any).rating || 0 }
            : undefined,
          route: (item.routes as any)
            ? { origin: (item.routes as any).origin, destination: (item.routes as any).destination }
            : undefined,
        })) as WeMoveRoute[];
    },
  });
}
