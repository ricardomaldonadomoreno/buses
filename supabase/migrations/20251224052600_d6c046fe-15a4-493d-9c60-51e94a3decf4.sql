-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  title TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create public read policies (these are public-facing content)
CREATE POLICY "Anyone can view active notifications" 
ON public.notifications 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('logo_text', 'BUSES APP'),
  ('tagline', 'Tu plataforma de transporte de confianza');

-- Insert sample notification
INSERT INTO public.notifications (title, message, is_active) VALUES 
  ('Bienvenido', 'Bienvenido a Buses.App - Tu plataforma de transporte', true);

-- Insert sample ad
INSERT INTO public.ads (title, image_url, is_active) VALUES 
  ('Publica Tu Empresa Aquí', null, true);