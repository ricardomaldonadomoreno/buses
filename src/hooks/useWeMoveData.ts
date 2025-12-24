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
  transporter?: {
    full_name: string;
    rating: number;
  };
  route?: {
    origin: Location;
    destination: Location;
  };
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });
}

export function useWeMoveRoutes(originId?: string, destinationId?: string, date?: Date) {
  return useQuery({
    queryKey: ['wemove-routes', originId, destinationId, date?.toISOString()],
    queryFn: async () => {
      // First get routes that match origin and destination
      let routeQuery = supabase
        .from('routes')
        .select('id, origin_location_id, destination_location_id');

      if (originId) {
        routeQuery = routeQuery.eq('origin_location_id', originId);
      }
      if (destinationId) {
        routeQuery = routeQuery.eq('destination_location_id', destinationId);
      }

      const { data: routes, error: routesError } = await routeQuery;
      if (routesError) throw routesError;

      if (!routes || routes.length === 0) {
        return [];
      }

      const routeIds = routes.map(r => r.id);

      // Get wemove_routes for these routes
      let wemoveQuery = supabase
        .from('wemove_routes')
        .select(`
          *,
          profiles:transporter_id (full_name, rating),
          routes:route_id (
            id,
            origin:origin_location_id (id, name, type),
            destination:destination_location_id (id, name, type)
          )
        `)
        .in('route_id', routeIds)
        .eq('status', 'active');

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        wemoveQuery = wemoveQuery
          .gte('departure_time', startOfDay.toISOString())
          .lte('departure_time', endOfDay.toISOString());
      }

      const { data, error } = await wemoveQuery.order('departure_time');
      
      if (error) throw error;
      
      return data?.map(item => ({
        id: item.id,
        transporter_id: item.transporter_id,
        transport_unit_id: item.transport_unit_id,
        route_id: item.route_id,
        departure_time: item.departure_time,
        available_seats: item.available_seats,
        price: item.price,
        status: item.status,
        transporter: item.profiles ? {
          full_name: (item.profiles as any).full_name || 'Unknown',
          rating: (item.profiles as any).rating || 0
        } : undefined,
        route: item.routes ? {
          origin: (item.routes as any).origin,
          destination: (item.routes as any).destination
        } : undefined
      })) as WeMoveRoute[];
    },
    enabled: true,
  });
}
