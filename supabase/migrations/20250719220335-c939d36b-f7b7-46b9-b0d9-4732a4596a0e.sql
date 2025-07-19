
-- Add columns to store GeoJSON data directly for Edge Function compatibility
ALTER TABLE boundaries 
ADD COLUMN geometry_geojson JSONB,
ADD COLUMN bbox_geojson JSONB,
ADD COLUMN center_lng DOUBLE PRECISION,
ADD COLUMN center_lat DOUBLE PRECISION;

-- Populate the new columns with existing data
UPDATE boundaries 
SET 
  geometry_geojson = ST_AsGeoJSON(geometry)::jsonb,
  bbox_geojson = ST_AsGeoJSON(bbox)::jsonb,
  center_lng = ST_X(ST_Centroid(geometry)),
  center_lat = ST_Y(ST_Centroid(geometry));

-- Create indexes for better performance
CREATE INDEX idx_boundaries_center_coords ON boundaries (center_lng, center_lat);
CREATE INDEX idx_boundaries_geometry_geojson ON boundaries USING GIN (geometry_geojson);
