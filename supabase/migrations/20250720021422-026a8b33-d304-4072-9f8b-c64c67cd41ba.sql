-- Create a table to store fetched city boundary data
CREATE TABLE public.city_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL, -- for fuzzy matching
  osm_relation_id BIGINT,
  boundary_data JSONB NOT NULL,
  area_km2 REAL,
  population BIGINT,
  country_code TEXT DEFAULT 'US',
  admin_level INTEGER,
  bbox JSONB,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_boundaries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "City boundaries are publicly readable" 
ON public.city_boundaries 
FOR SELECT 
USING (true);

-- Create index for faster name searches
CREATE INDEX idx_city_boundaries_normalized_name ON public.city_boundaries USING btree(normalized_name);
CREATE INDEX idx_city_boundaries_name ON public.city_boundaries USING btree(name);

-- Create function to normalize city names for fuzzy matching
CREATE OR REPLACE FUNCTION normalize_city_name(city_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(city_name, '\s+(city|metropolitan|metro|area|county|greater)\s*', ' ', 'gi'),
      '\s+', ' ', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-update normalized_name
CREATE OR REPLACE FUNCTION update_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name = normalize_city_name(NEW.name);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_normalized_name
BEFORE INSERT OR UPDATE ON public.city_boundaries
FOR EACH ROW
EXECUTE FUNCTION update_normalized_name();