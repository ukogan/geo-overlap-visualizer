-- Create function to upsert boundary data with proper geometry handling
CREATE OR REPLACE FUNCTION public.upsert_boundary(
  boundary_name TEXT,
  geojson_data JSONB,
  bbox_data JSONB,
  center_lng DOUBLE PRECISION,
  center_lat DOUBLE PRECISION,
  area_km2 REAL,
  admin_level INTEGER DEFAULT NULL,
  country_code TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.boundaries (
    name,
    geometry,
    geometry_geojson,
    bbox_geojson,
    center_lng,
    center_lat,
    area_km2,
    admin_level,
    country_code,
    updated_at
  ) VALUES (
    boundary_name,
    ST_GeomFromGeoJSON(geojson_data::text),
    geojson_data,
    bbox_data,
    center_lng,
    center_lat,
    area_km2,
    admin_level,
    country_code,
    now()
  )
  ON CONFLICT (name) DO UPDATE SET
    geometry = ST_GeomFromGeoJSON(geojson_data::text),
    geometry_geojson = geojson_data,
    bbox_geojson = bbox_data,
    center_lng = center_lng,
    center_lat = center_lat,
    area_km2 = area_km2,
    admin_level = admin_level,
    country_code = country_code,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;