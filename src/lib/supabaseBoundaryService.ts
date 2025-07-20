
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BoundarySearchResult {
  id: number | null;
  place_name: string;
  name: string;
  admin_level: number;
  country_code: string;
  area_km2: number | null;
  population: number | null;
  geometry: any;
  bbox: any;
  center?: [number, number];
  osm_id?: string;
  osm_type?: string;
  source?: 'local' | 'external';
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
  // Additional properties for statistics
  areaKm2?: number;
  population?: number;
  coordinateCount?: number;
  perimeterKm?: number;
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

    // Validate geometry before returning
    if (data && data.boundary) {
      const geometry = data.boundary.geometry;
      if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
        console.error('Invalid geometry data received:', geometry);
        toast.error('Invalid boundary geometry data');
        return null;
      }
      
      // Additional validation for polygon/multipolygon
      if (geometry.type === 'Polygon') {
        if (!Array.isArray(geometry.coordinates[0]) || geometry.coordinates[0].length < 4) {
          console.error('Invalid polygon coordinates');
          toast.error('Invalid polygon boundary data');
          return null;
        }
      } else if (geometry.type === 'MultiPolygon') {
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
          console.error('Invalid multipolygon coordinates');
          toast.error('Invalid multipolygon boundary data');
          return null;
        }
      }
    }

    console.log("Boundary data:", data);
    return data;
  } catch (error) {
    console.error("Error getting boundary data:", error);
    toast.error(`Failed to load boundary data`);
    return null;
  }
}

// Updated function to fetch OSM boundaries with OSM data
export async function fetchOSMBoundaries(locations: BoundarySearchResult[]): Promise<any> {
  try {
    console.log("Fetching OSM boundaries for locations:", locations);
    
    // Transform locations to include OSM data for dynamic query building
    const cities = locations.map(location => ({
      name: location.name,
      country: location.country_code || 'US',
      adminLevel: location.admin_level,
      osmId: location.osm_id,
      osmType: location.osm_type,
      relationId: location.osm_type === 'relation' ? location.osm_id : undefined
    }));

    const { data, error } = await supabase.functions.invoke('fetch-osm-boundaries', {
      body: { cities }
    });

    if (error) {
      console.error('Fetch OSM boundaries error:', error);
      toast.error('Failed to fetch boundary data');
      return { success: false, error: error.message };
    }

    console.log("OSM fetch results:", data);
    return data;
  } catch (error) {
    console.error("Error fetching OSM boundaries:", error);
    toast.error('Failed to fetch boundary data');
    return { success: false, error: error.message };
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
