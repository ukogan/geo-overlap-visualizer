import { createClient } from '@supabase/supabase-js'
import { toast } from "sonner";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface BoundarySearchResult {
  id: number;
  place_name: string;
  name: string;
  admin_level: number;
  country_code: string;
  area_km2: number;
  population: number;
  geometry: any;
  bbox: any;
}

export interface LocationBounds {
  boundary: {
    type: "Feature";
    geometry: any;
    properties: {
      name: string;
      area?: number;
      center?: [number, number];
    };
  };
  center: [number, number];
  bbox: [number, number, number, number];
}

// Search for boundaries using our hosted data
export async function searchBoundaries(query: string): Promise<BoundarySearchResult[]> {
  try {
    console.log("Searching boundaries for:", query);
    
    const { data, error } = await supabase.functions.invoke('search-boundaries', {
      body: { query }
    });

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    console.log("Search results:", data);
    return data.features || [];
  } catch (error) {
    console.error("Error searching boundaries:", error);
    return [];
  }
}

// Get specific boundary data by ID or name
export async function getBoundaryData(id: number | null, name: string | null): Promise<LocationBounds | null> {
  try {
    console.log("Getting boundary data for:", { id, name });
    
    const { data, error } = await supabase.functions.invoke('get-boundary', {
      body: { id, name }
    });

    if (error) {
      console.error('Get boundary error:', error);
      toast.error(`Could not load boundary data`);
      return null;
    }

    console.log("Boundary data:", data);
    return data;
  } catch (error) {
    console.error("Error getting boundary data:", error);
    toast.error(`Failed to load boundary data`);
    return null;
  }
}

// Calculate scale ratio between two boundaries
export function calculateScaleRatio(baseBounds: LocationBounds, overlayBounds: LocationBounds): number {
  const baseArea = baseBounds.boundary.properties.area || 1;
  const overlayArea = overlayBounds.boundary.properties.area || 1;
  
  // Return the square root of area ratio to get linear scale factor
  return Math.sqrt(baseArea / overlayArea);
}

// Transform overlay geometry to fit over base location
export function transformOverlayGeometry(
  overlayBounds: LocationBounds,
  baseLocation: [number, number],
  scaleRatio: number = 1
): any {
  const { boundary } = overlayBounds;
  const overlayCenter = boundary.properties.center || overlayBounds.center;
  
  // Calculate translation to move overlay center to base location
  const deltaLng = baseLocation[0] - overlayCenter[0];
  const deltaLat = baseLocation[1] - overlayCenter[1];
  
  // Transform coordinates
  const transformCoordinate = (coord: number[]): number[] => {
    const [lng, lat] = coord;
    // Scale around the overlay center, then translate to base location
    const scaledLng = overlayCenter[0] + (lng - overlayCenter[0]) * scaleRatio;
    const scaledLat = overlayCenter[1] + (lat - overlayCenter[1]) * scaleRatio;
    return [scaledLng + deltaLng, scaledLat + deltaLat];
  };

  const transformRing = (ring: number[][]): number[][] => 
    ring.map(transformCoordinate);

  const transformPolygon = (polygon: number[][][]): number[][][] =>
    polygon.map(transformRing);

  if (boundary.geometry.type === "Polygon") {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: transformRing(boundary.geometry.coordinates[0])
      },
      properties: {
        ...boundary.properties,
        center: baseLocation
      }
    };
  } else if (boundary.geometry.type === "MultiPolygon") {
    return {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: boundary.geometry.coordinates.map(transformPolygon)
      },
      properties: {
        ...boundary.properties,
        center: baseLocation
      }
    };
  }

  return boundary;
}