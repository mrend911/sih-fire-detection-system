CREATE TABLE public.fire_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fire_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text,
  temperature_celsius double precision NOT NULL,
  fire_type text NOT NULL,
  severity_level integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  resolved_address text,
  nearest_station_name text,
  nearest_station_address text,
  nearest_station_phone text,
  nearest_station_distance_km double precision,
  nearest_station_lat double precision,
  nearest_station_lng double precision,
  alert_message text,
  alert_sent boolean NOT NULL DEFAULT false,
  simulated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fire_events_created_at_idx ON public.fire_events (created_at DESC);

GRANT SELECT ON public.fire_stations TO anon, authenticated;
GRANT ALL ON public.fire_stations TO service_role;
GRANT SELECT, INSERT ON public.fire_events TO anon, authenticated;
GRANT ALL ON public.fire_events TO service_role;

ALTER TABLE public.fire_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fire stations are public" ON public.fire_stations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Fire events are public" ON public.fire_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can report a fire event" ON public.fire_events FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.fire_stations (name, address, phone, latitude, longitude, city) VALUES
('Danapith Fire Station', 'Danapith, Lal Darwaja, Ahmedabad, Gujarat 380001', '+91 79 2539 1002', 23.0225, 72.5797, 'Ahmedabad'),
('Naranpura Fire Station', 'Naranpura Char Rasta, Ahmedabad, Gujarat 380013', '+91 79 2743 2101', 23.0532, 72.5548, 'Ahmedabad'),
('Vastrapur Fire Station', 'Vastrapur Lake Road, Ahmedabad, Gujarat 380015', '+91 79 2630 4101', 23.0367, 72.5297, 'Ahmedabad'),
('Bapunagar Fire Station', 'Bapunagar, Ahmedabad, Gujarat 380024', '+91 79 2274 1101', 23.0421, 72.6394, 'Ahmedabad'),
('Odhav Industrial Fire Station', 'Odhav GIDC Estate, Ahmedabad, Gujarat 382415', '+91 79 2287 0101', 23.0202, 72.6663, 'Ahmedabad'),
('Vatva GIDC Fire Station', 'Vatva Industrial Estate, Ahmedabad, Gujarat 382445', '+91 79 2583 1101', 22.9573, 72.6291, 'Ahmedabad'),
('Sabarmati Fire Station', 'Sabarmati, Ahmedabad, Gujarat 380005', '+91 79 2750 2101', 23.0846, 72.5797, 'Ahmedabad'),
('Bopal Fire Station', 'Bopal Ghuma Road, Ahmedabad, Gujarat 380058', '+91 79 2717 1101', 23.0300, 72.4700, 'Ahmedabad'),
('Gandhinagar Sector 16 Fire Station', 'Sector 16, Gandhinagar, Gujarat 382016', '+91 79 2322 1101', 23.2280, 72.6500, 'Gandhinagar'),
('Vadodara Central Fire Station', 'Raopura, Vadodara, Gujarat 390001', '+91 265 242 3101', 22.3072, 73.1812, 'Vadodara'),
('Surat Chowk Bazaar Fire Station', 'Chowk Bazaar, Surat, Gujarat 395003', '+91 261 242 3101', 21.1938, 72.8231, 'Surat'),
('Rajkot Central Fire Station', 'Dhebar Road, Rajkot, Gujarat 360002', '+91 281 244 3101', 22.3039, 70.8022, 'Rajkot'),
('Mumbai Byculla Fire Station', 'Byculla, Mumbai, Maharashtra 400008', '+91 22 2307 6111', 18.9750, 72.8330, 'Mumbai'),
('Delhi Connaught Place Fire Station', 'Connaught Place, New Delhi 110001', '+91 11 2341 2222', 28.6304, 77.2177, 'Delhi'),
('Bengaluru Central Fire Station', 'Nrupathunga Road, Bengaluru, Karnataka 560001', '+91 80 2226 8888', 12.9716, 77.5946, 'Bengaluru'),
('Chennai Egmore Fire Station', 'Egmore, Chennai, Tamil Nadu 600008', '+91 44 2819 1010', 13.0732, 80.2609, 'Chennai'),
('Hyderabad Gandhinagar Fire Station', 'Gandhi Nagar, Hyderabad, Telangana 500080', '+91 40 2323 4100', 17.4260, 78.4870, 'Hyderabad'),
('Kolkata Central Fire Station', 'Free School Street, Kolkata, West Bengal 700016', '+91 33 2252 1101', 22.5540, 88.3520, 'Kolkata'),
('Pune Central Fire Station', 'Shivajinagar, Pune, Maharashtra 411005', '+91 20 2550 1101', 18.5308, 73.8475, 'Pune'),
('Jaipur Fire Station', 'Ram Niwas Bagh, Jaipur, Rajasthan 302004', '+91 141 269 1101', 26.9124, 75.7873, 'Jaipur');