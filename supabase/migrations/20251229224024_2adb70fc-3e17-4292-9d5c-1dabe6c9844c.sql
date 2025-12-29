-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('id_card', 'driver_license', 'passport');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('active', 'pending', 'blocked');

-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create enum for WeMove transporter role
CREATE TYPE public.wemove_role AS ENUM ('wemove_transporter');

-- Create country_codes table
CREATE TABLE public.country_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  country_iso TEXT NOT NULL,
  dial_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on country_codes
ALTER TABLE public.country_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active country codes
CREATE POLICY "Anyone can view active country codes"
ON public.country_codes
FOR SELECT
USING (is_active = true);

-- Create users table (extended user info)
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone_full TEXT,
  first_name TEXT,
  last_name TEXT,
  document_type document_type,
  document_number TEXT,
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own record
CREATE POLICY "Users can view own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own record
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role wemove_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_wemove_role(_user_id UUID, _role wemove_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create wemove_transporters table
CREATE TABLE public.wemove_transporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  active BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC DEFAULT 0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wemove_transporters
ALTER TABLE public.wemove_transporters ENABLE ROW LEVEL SECURITY;

-- Transporters can view their own record
CREATE POLICY "Transporters can view own record"
ON public.wemove_transporters
FOR SELECT
USING (auth.uid() = user_id);

-- Transporters can insert their own record
CREATE POLICY "Transporters can insert own record"
ON public.wemove_transporters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Transporters can update their own record
CREATE POLICY "Transporters can update own record"
ON public.wemove_transporters
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert sample country codes for Latin America
INSERT INTO public.country_codes (country_name, country_iso, dial_code) VALUES
('Argentina', 'AR', '+54'),
('Bolivia', 'BO', '+591'),
('Brazil', 'BR', '+55'),
('Chile', 'CL', '+56'),
('Colombia', 'CO', '+57'),
('Ecuador', 'EC', '+593'),
('Mexico', 'MX', '+52'),
('Paraguay', 'PY', '+595'),
('Peru', 'PE', '+51'),
('Uruguay', 'UY', '+598'),
('Venezuela', 'VE', '+58'),
('Spain', 'ES', '+34'),
('United States', 'US', '+1'),
('Portugal', 'PT', '+351');