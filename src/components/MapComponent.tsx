
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import { fetchLocationBoundary, calculateScaleRatio, transformOverlayGeometry, LocationBounds } from "@/lib/boundaryService";

interface MapComponentProps {
  baseLocation?: [number, number];
  overlayLocation?: [number, number];
  baseLocationName?: string;
  overlayLocationName?: string;
}

export const MapComponent = ({ 
  baseLocation, 
  overlayLocation, 
  baseLocationName, 
  overlayLocationName 
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [baseBounds, setBaseBounds] = useState<LocationBounds | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<LocationBounds | null>(null);
  const [isLoadingBoundaries, setIsLoadingBoundaries] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // For demo purposes, we'll use a placeholder token
    // In production, this should come from environment variables
    const token = mapboxToken || "pk.your_mapbox_token_here";
    mapboxgl.accessToken = token;

    // Show token input if no token is provided
    if (!mapboxToken) {
      toast("Please enter your Mapbox token to use the map", {
        duration: 5000,
        action: {
          label: "Enter Token",
          onClick: () => {
            const token = prompt("Enter your Mapbox public token (get one from https://mapbox.com):");
            if (token) {
              setMapboxToken(token);
            }
          }
        }
      });
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: baseLocation || [-74.5, 40],
        zoom: 9,
        attributionControl: false,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        "top-right"
      );

      // Add attribution
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true,
        }),
        "bottom-right"
      );

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
        toast("Map loaded! Select locations to compare.");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
      });

    } catch (error) {
      console.error("Error initializing map:", error);
      toast("Map initialization failed. Please check your Mapbox token.");
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Load base location boundary
  useEffect(() => {
    if (!mapLoaded || !map.current || !baseLocation || !baseLocationName || !mapboxToken) {
      console.log("Base boundary loading skipped - requirements not met:", {
        mapLoaded,
        hasMap: !!map.current,
        baseLocation,
        baseLocationName,
        mapboxToken: !!mapboxToken
      });
      return;
    }
    
    console.log("Loading base boundary for:", baseLocationName);
    setIsLoadingBoundaries(true);
    
    fetchLocationBoundary(baseLocationName, baseLocation, mapboxToken)
      .then((bounds) => {
        console.log("Base boundary loaded:", bounds);
        setBaseBounds(bounds);
        
        // Fit map to base boundary
        map.current?.fitBounds(bounds.bbox, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 2000
        });
        
        // Remove existing base boundary layers if they exist
        if (map.current?.getSource("base-boundary")) {
          if (map.current.getLayer("base-boundary-fill")) {
            map.current.removeLayer("base-boundary-fill");
          }
          if (map.current.getLayer("base-boundary-line")) {
            map.current.removeLayer("base-boundary-line");
          }
          map.current.removeSource("base-boundary");
        }
        
        // Add base boundary to map
        map.current?.addSource("base-boundary", {
          type: "geojson",
          data: bounds.boundary
        });
        
        map.current?.addLayer({
          id: "base-boundary-fill",
          type: "fill",
          source: "base-boundary",
          paint: {
            "fill-color": "hsl(var(--map-blue))",
            "fill-opacity": 0.1
          }
        });
        
        map.current?.addLayer({
          id: "base-boundary-line",
          type: "line",
          source: "base-boundary",
          paint: {
            "line-color": "hsl(var(--map-blue))",
            "line-width": 2,
            "line-opacity": 0.8
          }
        });

        // Add center marker
        new mapboxgl.Marker({ color: "hsl(var(--map-blue))" })
          .setLngLat(baseLocation)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-medium">${baseLocationName}</div>
               <div class="text-sm text-gray-600">Base Location</div>
               <div class="text-xs text-gray-500">Area: ${bounds.boundary.properties.area?.toFixed(0)} km²</div>`
            )
          )
          .addTo(map.current!);
      })
      .catch((error) => {
        console.error("Error loading base boundary:", error);
        toast.error(`Failed to load boundary for ${baseLocationName}`);
      })
      .finally(() => {
        setIsLoadingBoundaries(false);
      });
  }, [baseLocation, baseLocationName, mapboxToken, mapLoaded]);

  // Load overlay location boundary and create overlay
  useEffect(() => {
    if (!mapLoaded || !map.current || !overlayLocation || !overlayLocationName || !mapboxToken || !baseBounds) {
      console.log("Overlay loading skipped - requirements not met:", {
        mapLoaded,
        hasMap: !!map.current,
        overlayLocation,
        overlayLocationName,
        mapboxToken: !!mapboxToken,
        baseBounds: !!baseBounds
      });
      return;
    }
    
    console.log("Loading overlay boundary for:", overlayLocationName);
    setIsLoadingBoundaries(true);
    
    fetchLocationBoundary(overlayLocationName, overlayLocation, mapboxToken)
      .then((bounds) => {
        console.log("Overlay boundary loaded:", bounds);
        setOverlayBounds(bounds);
        
        // Calculate scale ratio (how much to scale overlay to match base)
        const scaleRatio = calculateScaleRatio(baseBounds, bounds);
        console.log("Scale ratio calculated:", scaleRatio);
        
        // Transform overlay geometry to fit over base location
        const transformedOverlay = transformOverlayGeometry(
          bounds, 
          baseBounds.center, 
          scaleRatio
        );
        console.log("Transformed overlay:", transformedOverlay);
        
        // Remove existing overlay layers if they exist
        if (map.current?.getSource("overlay-boundary")) {
          if (map.current.getLayer("overlay-boundary-fill")) {
            map.current.removeLayer("overlay-boundary-fill");
          }
          if (map.current.getLayer("overlay-boundary-line")) {
            map.current.removeLayer("overlay-boundary-line");
          }
          map.current.removeSource("overlay-boundary");
        }
        
        // Add transformed overlay to map
        map.current?.addSource("overlay-boundary", {
          type: "geojson",
          data: transformedOverlay
        });
        
        map.current?.addLayer({
          id: "overlay-boundary-fill",
          type: "fill",
          source: "overlay-boundary",
          paint: {
            "fill-color": "hsl(var(--map-green))",
            "fill-opacity": 0.2
          }
        });
        
        map.current?.addLayer({
          id: "overlay-boundary-line",
          type: "line",
          source: "overlay-boundary",
          paint: {
            "line-color": "hsl(var(--map-green))",
            "line-width": 2,
            "line-opacity": 0.9,
            "line-dasharray": [2, 2]
          }
        });

        // Add overlay center marker
        new mapboxgl.Marker({ color: "hsl(var(--map-green))" })
          .setLngLat(baseBounds.center)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-medium">${overlayLocationName}</div>
               <div class="text-sm text-gray-600">Overlay Location</div>
               <div class="text-xs text-gray-500">Area: ${bounds.boundary.properties.area?.toFixed(0)} km²</div>
               <div class="text-xs text-gray-500">Scale: ${scaleRatio.toFixed(2)}x</div>`
            )
          )
          .addTo(map.current!);

        const areaRatio = (baseBounds.boundary.properties.area || 1) / (bounds.boundary.properties.area || 1);
        toast.success(
          `${overlayLocationName} overlaid on ${baseLocationName}. Area ratio: ${areaRatio.toFixed(1)}:1`,
          { duration: 4000 }
        );
      })
      .catch((error) => {
        console.error("Error loading overlay boundary:", error);
        toast.error(`Failed to load boundary for ${overlayLocationName}`);
      })
      .finally(() => {
        setIsLoadingBoundaries(false);
      });
  }, [overlayLocation, overlayLocationName, mapboxToken, baseBounds, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden shadow-lg" />
      
      {/* Loading indicator for boundaries */}
      {isLoadingBoundaries && (
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading boundaries...
          </div>
        </div>
      )}
      
      {!mapboxToken && (
        <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-lg">
          <div className="text-center p-6 bg-card rounded-lg shadow-lg max-w-md">
            <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This demo requires a Mapbox token. Get one free at mapbox.com
            </p>
            <button
              onClick={() => {
                const token = prompt("Enter your Mapbox public token:");
                if (token) setMapboxToken(token);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Enter Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
