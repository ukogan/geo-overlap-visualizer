
import { useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import { ControlPanel } from "@/components/ControlPanel";
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
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
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
            
            {/* Comparison Info */}
            {baseLocation?.name && overlayLocation?.name && (
              <div className="mt-6 p-4 bg-card rounded-lg border shadow-sm">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-map-blue" />
                  Active Comparison
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-map-blue rounded-full"></div>
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">{baseLocation.name.split(',')[0]}</span>
                    {baseLocation.isLoading && (
                      <div className="w-3 h-3 border border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-map-green rounded-full"></div>
                    <span className="text-muted-foreground">Overlay:</span>
                    <span className="font-medium">{overlayLocation.name.split(',')[0]}</span>
                    {overlayLocation.isLoading && (
                      <div className="w-3 h-3 border border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
                {osmFetchResults.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    Last OSM update: {osmFetchResults.filter(r => r.success).length} of {osmFetchResults.length} successful
                  </div>
                )}
              </div>
            )}
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
      </main>
    </div>
  );
};

export default Index;
