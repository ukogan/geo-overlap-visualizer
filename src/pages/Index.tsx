
import { useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import { ControlPanel } from "@/components/ControlPanel";
import { LocationStats } from "@/components/LocationStats";
import { useBoundaryData } from "@/hooks/useBoundaryData";
import { Globe, ArrowRight } from "lucide-react";

const Index = () => {
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const {
    baseLocation,
    overlayLocation,
    osmFetchResults,
    selectBaseLocation,
    selectOverlayLocation,
    resetLocations,
    refreshBoundaryData,
    setOsmResults
  } = useBoundaryData();

  const handleBaseLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    selectBaseLocation(location, coordinates, boundaryId);
    // Store boundary ID for efficient lookup later
    (window as any).baseBoundaryId = boundaryId;
  };

  const handleOverlayLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    selectOverlayLocation(location, coordinates, boundaryId);
    // Store boundary ID for efficient lookup later
    (window as any).overlayBoundaryId = boundaryId;
  };

  const handleReset = () => {
    resetLocations();
    setMapRefreshKey(0);
  };

  const handleBoundaryDataRefresh = async () => {
    console.log('Triggering boundary data refresh...');
    await refreshBoundaryData();
    setMapRefreshKey(prev => prev + 1);
  };

  const handleOsmResults = (results: any[]) => {
    setOsmResults(results);
    // Trigger refresh after OSM data is updated
    setTimeout(() => {
      handleBoundaryDataRefresh();
    }, 1000);
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
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel
              onBaseLocationSelect={handleBaseLocationSelect}
              onOverlayLocationSelect={handleOverlayLocationSelect}
              baseLocationName={baseLocation?.name}
              overlayLocationName={overlayLocation?.name}
              onReset={handleReset}
              onBoundaryDataRefresh={handleBoundaryDataRefresh}
              onOsmResults={handleOsmResults}
            />
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="h-full rounded-lg overflow-hidden shadow-lg border">
              <MapComponent
                baseLocation={baseLocation?.coordinates}
                overlayLocation={overlayLocation?.coordinates}
                baseLocationName={baseLocation?.name}
                overlayLocationName={overlayLocation?.name}
                refreshKey={mapRefreshKey}
              />
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <LocationStats 
          baseLocation={baseLocation}
          overlayLocation={overlayLocation}
        />
      </main>
    </div>
  );
};

export default Index;
