import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationStep } from "./LocationStep";
import { DatabaseViewer } from "./DatabaseViewer";
import { RefreshCcw, Map, Database } from "lucide-react";
import { OSMFetchResult } from "@/hooks/useBoundaryData";

interface ControlPanelProps {
  onBaseLocationSelect: (location: string, coordinates: [number, number], boundaryId?: number) => void;
  onOverlayLocationSelect: (location: string, coordinates: [number, number], boundaryId?: number) => void;
  baseLocationName?: string;
  overlayLocationName?: string;
  onReset: () => void;
  onBoundaryDataRefresh: () => void;
  onOsmResults: (results: OSMFetchResult[]) => void;
}

export const ControlPanel = ({
  onBaseLocationSelect,
  onOverlayLocationSelect,
  baseLocationName,
  overlayLocationName,
  onReset,
  onBoundaryDataRefresh,
  onOsmResults,
}: ControlPanelProps) => {
  const [step, setStep] = useState<"base" | "overlay">("base");

  const handleBaseLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    onBaseLocationSelect(location, coordinates, boundaryId);
    setStep("overlay");
  };

  const handleOverlayLocationSelect = (location: string, coordinates: [number, number], boundaryId?: number) => {
    onOverlayLocationSelect(location, coordinates, boundaryId);
  };

  const handleReset = () => {
    onReset();
    setStep("base");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-map-blue" />
          <CardTitle className="text-lg">Geographic Comparison</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare the size and shape of different geographic locations
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="locations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="locations" className="text-xs">Locations</TabsTrigger>
            <TabsTrigger value="database" className="text-xs">Database</TabsTrigger>
          </TabsList>
          
          <TabsContent value="locations" className="space-y-6 mt-4">
            {/* Step 1: Base Location */}
            <LocationStep
              stepNumber={1}
              title="Base Location"
              description="This location will be shown on the map"
              color="blue"
              placeholder="Select base location (e.g., Tokyo)"
              selectedLocation={baseLocationName}
              onLocationSelect={handleBaseLocationSelect}
              isActive={step === "base"}
            />

            <Separator />

            {/* Step 2: Overlay Location */}
            <LocationStep
              stepNumber={2}
              title="Overlay Location" 
              description="This location's outline will be overlayed at the same scale"
              color="green"
              placeholder="Select overlay location (e.g., Bay Area)"
              selectedLocation={overlayLocationName}
              onLocationSelect={handleOverlayLocationSelect}
              isActive={step === "overlay" && !!baseLocationName}
            />

            {/* Reset Button */}
            {(baseLocationName || overlayLocationName) && (
              <>
                <Separator />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset Comparison
                </Button>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="database" className="mt-4">
            <DatabaseViewer />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};