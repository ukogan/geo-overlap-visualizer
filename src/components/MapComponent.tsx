import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { toast } from "sonner";

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
        toast("Map loaded! Select locations to compare.");
      });

    } catch (error) {
      console.error("Error initializing map:", error);
      toast("Map initialization failed. Please check your Mapbox token.");
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update map when base location changes
  useEffect(() => {
    if (map.current && baseLocation) {
      map.current.flyTo({
        center: baseLocation,
        zoom: 10,
        duration: 2000,
      });

      // Add marker for base location
      if (baseLocationName) {
        new mapboxgl.Marker({ color: "#2563eb" })
          .setLngLat(baseLocation)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="font-medium">${baseLocationName}</div><div class="text-sm text-gray-600">Base Location</div>`
            )
          )
          .addTo(map.current);
      }
    }
  }, [baseLocation, baseLocationName]);

  // Add overlay when overlay location is selected
  useEffect(() => {
    if (map.current && overlayLocation && overlayLocationName) {
      // Add marker for overlay location
      new mapboxgl.Marker({ color: "#16a34a" })
        .setLngLat(overlayLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="font-medium">${overlayLocationName}</div><div class="text-sm text-gray-600">Overlay Location</div>`
          )
        )
        .addTo(map.current);

      toast(`Overlaying ${overlayLocationName} on ${baseLocationName}`, {
        duration: 3000,
      });
    }
  }, [overlayLocation, overlayLocationName, baseLocationName]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden shadow-lg" />
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