
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";
import { getBoundaryData, calculateScaleRatio, transformOverlayGeometry, LocationBounds } from "@/lib/supabaseBoundaryService";

interface MapComponentProps {
  baseLocation?: [number, number];
  overlayLocation?: [number, number];
  baseLocationName?: string;
  overlayLocationName?: string;
  refreshKey?: number;
}

export const MapComponent = ({ 
  baseLocation, 
  overlayLocation, 
  baseLocationName, 
  overlayLocationName,
  refreshKey = 0
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [baseBounds, setBaseBounds] = useState<LocationBounds | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<LocationBounds | null>(null);
  const [isLoadingBoundaries, setIsLoadingBoundaries] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const baseMarker = useRef<mapboxgl.Marker | null>(null);
  const overlayMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    import("@/lib/config").then(({ MAPBOX_TOKEN }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: baseLocation || [-74.5, 40],
          zoom: 9,
          attributionControl: false,
        });

        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: false,
          }),
          "top-right"
        );

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
    }).catch((error) => {
      console.error("Error loading config:", error);
    });

    return () => {
      try {
        // Clean up markers first
        if (baseMarker.current) {
          baseMarker.current.remove();
          baseMarker.current = null;
        }
        if (overlayMarker.current) {
          overlayMarker.current.remove();
          overlayMarker.current = null;
        }
        
        // Clean up map only if it's properly initialized
        if (map.current && map.current.getContainer()) {
          // Remove map
          map.current.remove();
          map.current = null;
        }
      } catch (error) {
        console.warn("Error during map cleanup:", error);
        // Force cleanup if needed
        if (map.current) {
          map.current = null;
        }
      }
    };
  }, []);

  // Load base location boundary
  useEffect(() => {
    if (!mapLoaded || !map.current || !baseLocation || !baseLocationName) {
      return;
    }
    
    console.log(`Loading base boundary for: ${baseLocationName} (refresh key: ${refreshKey})`);
    setIsLoadingBoundaries(true);
    
    const boundaryId = (window as any).baseBoundaryId;
    getBoundaryData(boundaryId, baseLocationName)
      .then((bounds) => {
        console.log("Base boundary loaded:", bounds);
        setBaseBounds(bounds);
        
        // Remove existing layers
        if (map.current?.getSource("base-boundary")) {
          if (map.current.getLayer("base-boundary-fill")) {
            map.current.removeLayer("base-boundary-fill");
          }
          if (map.current.getLayer("base-boundary-line")) {
            map.current.removeLayer("base-boundary-line");
          }
          map.current.removeSource("base-boundary");
        }
        
        // Add boundary to map
        map.current?.addSource("base-boundary", {
          type: "geojson",
          data: bounds.boundary
        });
        
        map.current?.addLayer({
          id: "base-boundary-fill",
          type: "fill",
          source: "base-boundary",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.1
          }
        });
        
        map.current?.addLayer({
          id: "base-boundary-line",
          type: "line",
          source: "base-boundary",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-opacity": 0.8
          }
        });

        // Update marker
        baseMarker.current?.remove();
        baseMarker.current = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat(baseLocation)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-medium">${baseLocationName}</div>
               <div class="text-sm text-gray-600">Base Location</div>
               <div class="text-xs text-gray-500">Area: ${bounds.boundary.properties.area?.toFixed(0) || 'N/A'} km²</div>`
            )
          )
          .addTo(map.current!);

        // Fit map to boundary
        map.current?.fitBounds(bounds.bbox, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 2000
        });
      })
      .catch((error) => {
        console.error("Error loading base boundary:", error);
        toast.error(`Failed to load boundary for ${baseLocationName}`);
      })
      .finally(() => {
        setIsLoadingBoundaries(false);
      });
  }, [baseLocation, baseLocationName, mapLoaded, refreshKey]);

  // Load overlay location boundary
  useEffect(() => {
    if (!mapLoaded || !map.current || !overlayLocation || !overlayLocationName || !baseBounds) {
      return;
    }
    
    console.log(`Loading overlay boundary for: ${overlayLocationName} (refresh key: ${refreshKey})`);
    setIsLoadingBoundaries(true);
    
    const boundaryId = (window as any).overlayBoundaryId;
    getBoundaryData(boundaryId, overlayLocationName)
      .then((bounds) => {
        console.log("Overlay boundary loaded:", bounds);
        setOverlayBounds(bounds);
        
        const scaleRatio = calculateScaleRatio(baseBounds, bounds);
        console.log("Scale ratio calculated:", scaleRatio);
        
        const transformedOverlay = transformOverlayGeometry(
          bounds, 
          baseBounds.center, 
          scaleRatio
        );
        
        // Remove existing overlay layers
        if (map.current?.getSource("overlay-boundary")) {
          if (map.current.getLayer("overlay-boundary-fill")) {
            map.current.removeLayer("overlay-boundary-fill");
          }
          if (map.current.getLayer("overlay-boundary-line")) {
            map.current.removeLayer("overlay-boundary-line");
          }
          map.current.removeSource("overlay-boundary");
        }
        
        // Add transformed overlay
        map.current?.addSource("overlay-boundary", {
          type: "geojson",
          data: transformedOverlay
        });
        
        map.current?.addLayer({
          id: "overlay-boundary-fill",
          type: "fill",
          source: "overlay-boundary",
          paint: {
            "fill-color": "#10b981",
            "fill-opacity": 0.2
          }
        });
        
        map.current?.addLayer({
          id: "overlay-boundary-line",
          type: "line",
          source: "overlay-boundary",
          paint: {
            "line-color": "#10b981",
            "line-width": 2,
            "line-opacity": 0.9,
            "line-dasharray": [2, 2]
          }
        });

        // Update overlay marker
        overlayMarker.current?.remove();
        overlayMarker.current = new mapboxgl.Marker({ color: "#10b981" })
          .setLngLat(baseBounds.center)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-medium">${overlayLocationName}</div>
               <div class="text-sm text-gray-600">Overlay Location</div>
               <div class="text-xs text-gray-500">Area: ${bounds.boundary.properties.area?.toFixed(0) || 'N/A'} km²</div>
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
  }, [overlayLocation, overlayLocationName, baseBounds, mapLoaded, refreshKey]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden shadow-lg" />
      
      {isLoadingBoundaries && (
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading boundaries...
          </div>
        </div>
      )}

      {refreshKey > 0 && (
        <div className="absolute top-4 right-4 bg-blue-50/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg border border-blue-200">
          <div className="text-xs text-blue-700">
            Data refreshed
          </div>
        </div>
      )}
    </div>
  );
};
