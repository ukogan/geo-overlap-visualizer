-- Check if bbox column should be computed from geometry automatically
-- Also add better error handling and validation to the upsert function

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
DECLARE
  geom_obj geometry;
BEGIN
  -- Validate input
  IF boundary_name IS NULL OR boundary_name = '' THEN
    RAISE EXCEPTION 'boundary_name cannot be null or empty';
  END IF;
  
  IF geojson_data IS NULL THEN
    RAISE EXCEPTION 'geojson_data cannot be null';
  END IF;

  -- Convert GeoJSON to geometry and validate
  BEGIN
    geom_obj := ST_GeomFromGeoJSON(geojson_data::text);
    IF geom_obj IS NULL THEN
      RAISE EXCEPTION 'Invalid GeoJSON data provided';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to parse GeoJSON: %', SQLERRM;
  END;

  -- Insert or update the boundary
  INSERT INTO public.boundaries (
    name,
    geometry,
    bbox, -- Auto-compute bbox from geometry
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
    geom_obj,
    ST_Envelope(geom_obj), -- Auto-compute bbox
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
    geometry = geom_obj,
    bbox = ST_Envelope(geom_obj), -- Auto-compute bbox
    geometry_geojson = EXCLUDED.geometry_geojson,
    bbox_geojson = EXCLUDED.bbox_geojson,
    center_lng = EXCLUDED.center_lng,
    center_lat = EXCLUDED.center_lat,
    area_km2 = EXCLUDED.area_km2,
    admin_level = EXCLUDED.admin_level,
    country_code = EXCLUDED.country_code,
    updated_at = now();

END;
$$ LANGUAGE plpgsql;