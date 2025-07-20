import { useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import { ControlPanel } from "@/components/ControlPanel";
import { Globe, ArrowRight } from "lucide-react";

const Index = () => {
  const [baseLocation, setBaseLocation] = useState<[number, number] | undefined>();
  const [overlayLocation, setOverlayLocation] = useState<[number, number] | undefined>();
  const [baseLocationName, setBaseLocationName] = useState<string>("");
  const [overlayLocationName, setOverlayLocationName] = useState<string>("");
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const handleBaseLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    setBaseLocation(coordinates);
    setBaseLocationName(location);
    // Store boundary ID for efficient lookup later
    (window as any).baseBoundaryId = boundaryId;
  };

  const handleOverlayLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    setOverlayLocation(coordinates);
    setOverlayLocationName(location);
    // Store boundary ID for efficient lookup later
    (window as any).overlayBoundaryId = boundaryId;
  };

  const handleReset = () => {
    setBaseLocation(undefined);
    setOverlayLocation(undefined);
    setBaseLocationName("");
    setOverlayLocationName("");
  };

  const handleBoundaryDataRefresh = () => {
    setMapRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-map-blue to-map-green rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">GeoCompare</h1>
              <p className="text-sm text-muted-foreground">Compare geographic locations at scale</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel
              onBaseLocationSelect={handleBaseLocationSelect}
              onOverlayLocationSelect={handleOverlayLocationSelect}
              baseLocationName={baseLocationName}
              overlayLocationName={overlayLocationName}
              onReset={handleReset}
              onBoundaryDataRefresh={handleBoundaryDataRefresh}
            />
            
            {/* Comparison Info */}
            {baseLocationName && overlayLocationName && (
              <div className="mt-6 p-4 bg-card rounded-lg border shadow-sm">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-map-blue" />
                  Active Comparison
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-map-blue rounded-full"></div>
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">{baseLocationName.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-map-green rounded-full"></div>
                    <span className="text-muted-foreground">Overlay:</span>
                    <span className="font-medium">{overlayLocationName.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="h-full rounded-lg overflow-hidden shadow-lg border">
              <MapComponent
                key={mapRefreshKey}
                baseLocation={baseLocation}
                overlayLocation={overlayLocation}
                baseLocationName={baseLocationName}
                overlayLocationName={overlayLocationName}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
