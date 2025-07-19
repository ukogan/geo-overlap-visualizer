import { toast } from "sonner";

export interface BoundaryData {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  } | {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  properties: {
    name: string;
    area?: number; // in square kilometers
    center?: [number, number];
  };
}

export interface LocationBounds {
  boundary: BoundaryData;
  center: [number, number];
  bbox: [number, number, number, number]; // [west, south, east, north]
}

// Calculate area of a polygon in square kilometers
function calculatePolygonArea(coordinates: number[][][]): number {
  // Simple approximation using the shoelace formula
  // For more accuracy, we'd use a proper geodesic calculation
  let area = 0;
  for (const ring of coordinates) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      area += (x2 - x1) * (y2 + y1);
    }
  }
  // Convert to approximate square kilometers (very rough approximation)
  return Math.abs(area) * 111 * 111 / 2; // 1 degree ≈ 111 km
}

// Get bounding box from geometry
function getBoundingBox(geometry: BoundaryData["geometry"]): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  
  const processCoordinates = (coords: number[]) => {
    const [lng, lat] = coords;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  };

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach(ring => 
      ring.forEach(coord => processCoordinates(coord))
    );
  } else {
    geometry.coordinates.forEach(polygon => 
      polygon.forEach(ring => 
        ring.forEach(coord => processCoordinates(coord))
      )
    );
  }

  return [minLng, minLat, maxLng, maxLat];
}

// Fetch boundary data for a location using Nominatim (OpenStreetMap)
export async function fetchLocationBoundary(
  locationName: string, 
  coordinates: [number, number],
  mapboxToken: string // Keep for compatibility, but we'll use Nominatim for boundaries
): Promise<LocationBounds> {
  try {
    console.log("Fetching boundary for:", locationName);
    // Use Nominatim API for actual polygon boundaries
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=${encodeURIComponent(locationName)}`
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Nominatim API response:", data);
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      console.log("Feature geometry type:", feature.geometry?.type);
      
      if (feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")) {
        const boundary: BoundaryData = {
          type: "Feature",
          geometry: feature.geometry,
          properties: {
            name: feature.properties?.display_name || locationName,
            center: coordinates // Use the coordinates from our search
          }
        };

        // Calculate area
        if (feature.geometry.type === "Polygon") {
          boundary.properties.area = calculatePolygonArea(feature.geometry.coordinates);
        } else {
          // For MultiPolygon, sum all polygon areas
          boundary.properties.area = feature.geometry.coordinates.reduce(
            (total: number, polygon: number[][][]) => total + calculatePolygonArea(polygon), 
            0
          );
        }

        const bbox = getBoundingBox(feature.geometry);
        const center: [number, number] = [
          (bbox[0] + bbox[2]) / 2,
          (bbox[1] + bbox[3]) / 2
        ];

        return {
          boundary,
          center,
          bbox
        };
      }
    }

    console.log("No polygon data found, creating fallback boundary for:", locationName);
    // Fallback: create a rough circular approximation
    return createFallbackBoundary(locationName, coordinates);

  } catch (error) {
    console.error("Error fetching boundary from Nominatim:", error);
    toast.error(`Could not load boundary for ${locationName}. Using approximate area.`);
    return createFallbackBoundary(locationName, coordinates);
  }
}

// Create a fallback circular boundary when actual boundary data isn't available
function createFallbackBoundary(locationName: string, coordinates: [number, number]): LocationBounds {
  const [lng, lat] = coordinates;
  
  // Create a rough circular boundary (approximate radius based on location type)
  const radius = 0.1; // degrees (roughly 11km)
  const points = 32;
  const circleCoords: number[][] = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const x = lng + radius * Math.cos(angle);
    const y = lat + radius * Math.sin(angle);
    circleCoords.push([x, y]);
  }

  const boundary: BoundaryData = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [circleCoords]
    },
    properties: {
      name: locationName,
      area: Math.PI * Math.pow(radius * 111, 2), // Approximate area in km²
      center: coordinates
    }
  };

  const radiusDeg = radius;
  const bbox: [number, number, number, number] = [
    lng - radiusDeg,
    lat - radiusDeg, 
    lng + radiusDeg,
    lat + radiusDeg
  ];

  return {
    boundary,
    center: coordinates,
    bbox
  };
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
): BoundaryData {
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

  if (boundary.geometry.type === "Polygon") {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: boundary.geometry.coordinates.map(transformRing)
      },
      properties: {
        ...boundary.properties,
        center: baseLocation
      }
    };
  } else {
    return {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: boundary.geometry.coordinates.map((polygon: number[][][]) => 
          polygon.map(transformRing)
        )
      },
      properties: {
        ...boundary.properties,
        center: baseLocation
      }
    };
  }
}