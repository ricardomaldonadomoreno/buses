-- Create location type enum
CREATE TYPE public.location_type AS ENUM ('country', 'city', 'terminal');

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('passenger', 'transporter');

-- Create wemove route status enum
CREATE TYPE public.wemove_route_status AS ENUM ('active', 'completed', 'cancelled');

-- Create locations table (central matrix)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type location_type NOT NULL,
  parent_id UUID REFERENCES public.locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routes table
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_location_id UUID NOT NULL REFERENCES public.locations(id),
  destination_location_id UUID NOT NULL REFERENCES public.locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'passenger',
  rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transport_units table
CREATE TABLE public.transport_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wemove_routes table
CREATE TABLE public.wemove_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transporter_id UUID NOT NULL REFERENCES public.profiles(id),
  transport_unit_id UUID NOT NULL REFERENCES public.transport_units(id),
  route_id UUID NOT NULL REFERENCES public.routes(id),
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  status wemove_route_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wemove_routes ENABLE ROW LEVEL SECURITY;

-- Locations: Anyone can view active locations
CREATE POLICY "Anyone can view active locations" ON public.locations
FOR SELECT USING (is_active = true);

-- Routes: Anyone can view active routes
CREATE POLICY "Anyone can view active routes" ON public.routes
FOR SELECT USING (is_active = true);

-- Profiles: Anyone can view profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Profiles: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Transport units: Anyone can view verified units
CREATE POLICY "Anyone can view transport units" ON public.transport_units
FOR SELECT USING (true);

-- Transport units: Transporters can manage their own units
CREATE POLICY "Transporters can insert own units" ON public.transport_units
FOR INSERT WITH CHECK (auth.uid() = transporter_id);

CREATE POLICY "Transporters can update own units" ON public.transport_units
FOR UPDATE USING (auth.uid() = transporter_id);

-- WeMove routes: Anyone can view active routes
CREATE POLICY "Anyone can view active wemove routes" ON public.wemove_routes
FOR SELECT USING (status = 'active');

-- WeMove routes: Transporters can manage their own routes
CREATE POLICY "Transporters can insert own wemove routes" ON public.wemove_routes
FOR INSERT WITH CHECK (auth.uid() = transporter_id);

CREATE POLICY "Transporters can update own wemove routes" ON public.wemove_routes
FOR UPDATE USING (auth.uid() = transporter_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample locations
INSERT INTO public.locations (name, type, is_active) VALUES
('Venezuela', 'country', true),
('Colombia', 'country', true),
('Caracas', 'city', true),
('Maracaibo', 'city', true),
('Valencia', 'city', true),
('Bogotá', 'city', true),
('Medellín', 'city', true),
('Cúcuta', 'city', true);

-- Insert sample routes
INSERT INTO public.routes (origin_location_id, destination_location_id, is_active)
SELECT o.id, d.id, true
FROM public.locations o, public.locations d
WHERE o.name = 'Caracas' AND d.name = 'Maracaibo'
UNION ALL
SELECT o.id, d.id, true
FROM public.locations o, public.locations d
WHERE o.name = 'Caracas' AND d.name = 'Valencia'
UNION ALL
SELECT o.id, d.id, true
FROM public.locations o, public.locations d
WHERE o.name = 'Maracaibo' AND d.name = 'Bogotá'
UNION ALL
SELECT o.id, d.id, true
FROM public.locations o, public.locations d
WHERE o.name = 'Cúcuta' AND d.name = 'Bogotá';