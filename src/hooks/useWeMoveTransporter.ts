// src/hooks/useWeMoveTransporter.ts
// ARCHIVO COMPLETO — reemplazar el existente

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Tipos ──────────────────────────────────────────────────────

export interface TransportUnit {
  id:           string;
  transporter_id: string;
  type:         string;
  capacity:     number;
  verified:     boolean;
  plate?:       string | null;
  color?:       string | null;
  seat_layout?: any | null;
  created_at:   string;
}

export interface MyProfile {
  id:            string;
  full_name:     string | null;
  rating:        number | null;
  role:          string;
  profile_photo?: string | null;
  bio?:          string | null;
  created_at:    string;
  updated_at:    string;
}

export interface MyWeMoveRoute {
  id:              string;
  transporter_id:  string;
  transport_unit_id: string;
  route_id:        string;
  departure_time:  string;
  available_seats: number;
  price:           number;
  status:          string;
  trip_code?:      string | null;
  notes?:          string | null;
  deleted_at?:     string | null;
  created_at:      string;
  route?: {
    origin:      { id: string; name: string } | null;
    destination: { id: string; name: string } | null;
  };
  transport_unit?: {
    type:        string;
    capacity:    number;
    plate?:      string | null;
    color?:      string | null;
    seat_layout?: any | null;
  };
}

// ── Hooks ──────────────────────────────────────────────────────

export function useMyProfile(userId?: string) {
  return useQuery({
    queryKey: ['my-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as MyProfile | null;
    },
    enabled: !!userId,
  });
}

export function useMyUserData(userId?: string) {
  return useQuery({
    queryKey: ['my-user-data', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useMyWeMoveTransporter(userId?: string) {
  return useQuery({
    queryKey: ['my-wemove-transporter', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('wemove_transporters')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useMyTransportUnits(userId?: string) {
  return useQuery({
    queryKey: ['my-transport-units', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('transport_units')
        .select('id, transporter_id, type, capacity, verified, plate, color, seat_layout, created_at')
        .eq('transporter_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TransportUnit[];
    },
    enabled: !!userId,
  });
}

export function useMyWeMoveRoutes(userId?: string) {
  return useQuery({
    queryKey: ['my-wemove-routes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('wemove_routes')
        .select(`
          *,
          routes:route_id (
            id,
            origin:origin_location_id (id, name),
            destination:destination_location_id (id, name)
          ),
          transport_units:transport_unit_id (type, capacity, plate, color, seat_layout)
        `)
        .eq('transporter_id', userId)
        .is('deleted_at', null)
        .order('departure_time', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(item => ({
        ...item,
        route: item.routes ? {
          origin:      (item.routes as any).origin,
          destination: (item.routes as any).destination,
        } : undefined,
        transport_unit: item.transport_units ? {
          type:        (item.transport_units as any).type,
          capacity:    (item.transport_units as any).capacity,
          plate:       (item.transport_units as any).plate,
          color:       (item.transport_units as any).color,
          seat_layout: (item.transport_units as any).seat_layout,
        } : undefined,
      })) as MyWeMoveRoute[];
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-profile', userId] });
    },
  });
}

export function useUpsertTransportUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      transporterId,
      type,
      capacity,
      plate,
      color,
    }: {
      unitId?:      string;
      transporterId: string;
      type:         string;
      capacity:     number;
      plate?:       string;
      color?:       string;
    }) => {
      if (unitId) {
        const { data, error } = await supabase
          .from('transport_units')
          .update({
            type,
            capacity,
            plate:  plate ?? null,
            color:  color ?? null,
          })
          .eq('id', unitId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('transport_units')
          .insert({
            transporter_id: transporterId,
            type,
            capacity,
            plate:    plate ?? null,
            color:    color ?? null,
            verified: false,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, { transporterId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-transport-units', transporterId] });
    },
  });
}

export function useDeleteTransportUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, userId }: { unitId: string; userId: string }) => {
      const { error } = await supabase
        .from('transport_units')
        .delete()
        .eq('id', unitId);
      if (error) throw error;
      return { unitId, userId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-transport-units', result.userId] });
    },
  });
}

export function usePublishWeMoveRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transporterId,
      transportUnitId,
      originId,
      destinationId,
      departureTime,
      availableSeats,
      price,
    }: {
      transporterId:   string;
      transportUnitId: string;
      originId:        string;
      destinationId:   string;
      departureTime:   string;
      availableSeats:  number;
      price:           number;
    }) => {
      // Buscar o crear la ruta base
      const { data: existingRoute, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('origin_location_id', originId)
        .eq('destination_location_id', destinationId)
        .eq('is_active', true)
        .maybeSingle();
      if (routeError) throw routeError;

      let routeId: string;
      if (existingRoute) {
        routeId = existingRoute.id;
      } else {
        const { data: newRoute, error: createRouteError } = await supabase
          .from('routes')
          .insert({
            origin_location_id:      originId,
            destination_location_id: destinationId,
            is_active: true,
          })
          .select('id')
          .single();
        if (createRouteError) throw createRouteError;
        routeId = newRoute.id;
      }

      const { data, error } = await supabase
        .from('wemove_routes')
        .insert({
          transporter_id:    transporterId,
          transport_unit_id: transportUnitId,
          route_id:          routeId,
          departure_time:    departureTime,
          available_seats:   availableSeats,
          price,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { transporterId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-wemove-routes', transporterId] });
      queryClient.invalidateQueries({ queryKey: ['wemove-routes'] });
    },
  });
}

export function useCancelWeMoveRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, userId }: { routeId: string; userId: string }) => {
      // Usar la función SQL que decide soft vs hard delete
      const { data, error } = await supabase
        .rpc('can_delete_route', {
          p_route_id: routeId,
          p_user_id:  userId,
        });
      if (error) throw error;
      return { userId, result: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-wemove-routes', result.userId] });
      queryClient.invalidateQueries({ queryKey: ['wemove-routes'] });
    },
  });
}
