import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TransportUnit {
  id: string;
  transporter_id: string;
  type: string;
  capacity: number;
  verified: boolean;
  created_at: string;
}

export interface WeMoveTransporter {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  active: boolean;
  rating: number | null;
  total_trips: number;
}

export interface TransporterProfile {
  id: string;
  full_name: string | null;
  role: string;
  rating: number | null;
}

export interface MyWeMoveRoute {
  id: string;
  transporter_id: string;
  transport_unit_id: string;
  route_id: string;
  departure_time: string;
  available_seats: number;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
  route?: {
    origin: { id: string; name: string };
    destination: { id: string; name: string };
  };
  transport_unit?: {
    type: string;
    capacity: number;
  };
}

// Fetch current transporter record
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
      return data as WeMoveTransporter | null;
    },
    enabled: !!userId,
  });
}

// Fetch transporter profile
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
      return data as TransporterProfile | null;
    },
    enabled: !!userId,
  });
}

// Fetch user extended info
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

// Fetch my transport units
export function useMyTransportUnits(userId?: string) {
  return useQuery({
    queryKey: ['my-transport-units', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('transport_units')
        .select('*')
        .eq('transporter_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TransportUnit[];
    },
    enabled: !!userId,
  });
}

// Fetch my published routes
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
          transport_units:transport_unit_id (type, capacity)
        `)
        .eq('transporter_id', userId)
        .order('departure_time', { ascending: false });
      if (error) throw error;
      return data?.map(item => ({
        ...item,
        route: item.routes ? {
          origin: (item.routes as any).origin,
          destination: (item.routes as any).destination,
        } : undefined,
        transport_unit: item.transport_units ? {
          type: (item.transport_units as any).type,
          capacity: (item.transport_units as any).capacity,
        } : undefined,
      })) as MyWeMoveRoute[];
    },
    enabled: !!userId,
  });
}

// Update profile name
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

// Create or update transport unit
export function useUpsertTransportUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      unitId,
      transporterId,
      type,
      capacity,
    }: {
      unitId?: string;
      transporterId: string;
      type: string;
      capacity: number;
    }) => {
      if (unitId) {
        const { data, error } = await supabase
          .from('transport_units')
          .update({ type, capacity })
          .eq('id', unitId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('transport_units')
          .insert({ transporter_id: transporterId, type, capacity, verified: false })
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

// Delete transport unit
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

// Publish a new wemove route
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
      transporterId: string;
      transportUnitId: string;
      originId: string;
      destinationId: string;
      departureTime: string;
      availableSeats: number;
      price: number;
    }) => {
      // 1. Find or create route
      let routeId: string;

      const { data: existingRoute, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('origin_location_id', originId)
        .eq('destination_location_id', destinationId)
        .eq('is_active', true)
        .maybeSingle();

      if (routeError) throw routeError;

      if (existingRoute) {
        routeId = existingRoute.id;
      } else {
        const { data: newRoute, error: createRouteError } = await supabase
          .from('routes')
          .insert({
            origin_location_id: originId,
            destination_location_id: destinationId,
            is_active: true,
          })
          .select('id')
          .single();
        if (createRouteError) throw createRouteError;
        routeId = newRoute.id;
      }

      // 2. Create wemove_route
      const { data, error } = await supabase
        .from('wemove_routes')
        .insert({
          transporter_id: transporterId,
          transport_unit_id: transportUnitId,
          route_id: routeId,
          departure_time: departureTime,
          available_seats: availableSeats,
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

// Cancel a route
export function useCancelWeMoveRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, userId }: { routeId: string; userId: string }) => {
      const { error } = await supabase
        .from('wemove_routes')
        .update({ status: 'cancelled' })
        .eq('id', routeId)
        .eq('transporter_id', userId);
      if (error) throw error;
      return { userId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['my-wemove-routes', result.userId] });
      queryClient.invalidateQueries({ queryKey: ['wemove-routes'] });
    },
  });
}
