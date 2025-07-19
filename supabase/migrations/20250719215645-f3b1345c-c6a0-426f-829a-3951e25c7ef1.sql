-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create boundaries table to store geographic boundary data
CREATE TABLE boundaries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_long TEXT,
    admin_level INTEGER, -- 0=country, 1=state/province, 2=county/region, etc.
    country_code TEXT,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    bbox GEOMETRY(POLYGON, 4326),
    area_km2 REAL,
    population BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for fast geographic queries
CREATE INDEX idx_boundaries_geometry ON boundaries USING GIST (geometry);
CREATE INDEX idx_boundaries_name ON boundaries (name);
CREATE INDEX idx_boundaries_admin_level ON boundaries (admin_level);
CREATE INDEX idx_boundaries_country_code ON boundaries (country_code);

-- Enable Row Level Security
ALTER TABLE boundaries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to boundaries data
CREATE POLICY "Allow public read access to boundaries" ON boundaries
    FOR SELECT USING (true);