CREATE TABLE public.emergency_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_name text NOT NULL,
  caller_phone text NOT NULL,
  location_text text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  emergency_type text NOT NULL,
  urgency_level integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  dispatched_station_name text,
  dispatched_station_phone text,
  dispatched_station_distance_km double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.emergency_calls TO anon;
GRANT SELECT, INSERT, UPDATE ON public.emergency_calls TO authenticated;
GRANT ALL ON public.emergency_calls TO service_role;

ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Emergency calls are public" ON public.emergency_calls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can place an emergency call" ON public.emergency_calls FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update call status" ON public.emergency_calls FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_emergency_calls_updated_at
BEFORE UPDATE ON public.emergency_calls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();