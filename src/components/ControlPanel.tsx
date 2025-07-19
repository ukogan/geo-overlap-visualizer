import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LocationSearch } from "./LocationSearch";
import { RefreshCcw, Map, Layers } from "lucide-react";

interface ControlPanelProps {
  onBaseLocationSelect: (location: string, coordinates: [number, number]) => void;
  onOverlayLocationSelect: (location: string, coordinates: [number, number]) => void;
  baseLocationName?: string;
  overlayLocationName?: string;
  onReset: () => void;
}

export const ControlPanel = ({
  onBaseLocationSelect,
  onOverlayLocationSelect,
  baseLocationName,
  overlayLocationName,
  onReset,
}: ControlPanelProps) => {
  const [step, setStep] = useState<"base" | "overlay">("base");

  const handleBaseLocationSelect = (location: string, coordinates: [number, number]) => {
    onBaseLocationSelect(location, coordinates);
    setStep("overlay");
  };

  const handleOverlayLocationSelect = (location: string, coordinates: [number, number]) => {
    onOverlayLocationSelect(location, coordinates);
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
      
      <CardContent className="space-y-6">
        {/* Step 1: Base Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={step === "base" ? "default" : "secondary"} className="text-xs">
              1
            </Badge>
            <span className="text-sm font-medium">Base Location</span>
            {baseLocationName && (
              <Badge variant="outline" className="text-xs bg-map-blue/10 text-map-blue border-map-blue/20">
                {baseLocationName.split(',')[0]}
              </Badge>
            )}
          </div>
          <LocationSearch
            onLocationSelect={handleBaseLocationSelect}
            placeholder="Select base location (e.g., Tokyo)"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This location will be shown on the map
          </p>
        </div>

        <Separator />

        {/* Step 2: Overlay Location */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={step === "overlay" && baseLocationName ? "default" : "secondary"} className="text-xs">
              2
            </Badge>
            <span className="text-sm font-medium">Overlay Location</span>
            {overlayLocationName && (
              <Badge variant="outline" className="text-xs bg-map-green/10 text-map-green border-map-green/20">
                {overlayLocationName.split(',')[0]}
              </Badge>
            )}
          </div>
          <LocationSearch
            onLocationSelect={handleOverlayLocationSelect}
            placeholder="Select overlay location (e.g., Bay Area)"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This location's outline will be overlayed at the same scale
          </p>
        </div>

        {/* Example Comparisons */}
        <div className="space-y-3">
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Popular Comparisons</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-8"
                onClick={() => {
                  handleBaseLocationSelect("Tokyo, Japan", [139.6917, 35.6895]);
                  setTimeout(() => {
                    handleOverlayLocationSelect("San Francisco Bay Area, California, United States", [-122.4194, 37.7749]);
                  }, 1000);
                }}
              >
                Tokyo vs Bay Area
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-8"
                onClick={() => {
                  handleBaseLocationSelect("Switzerland", [8.2275, 46.8182]);
                  setTimeout(() => {
                    handleOverlayLocationSelect("Rhode Island, United States", [-71.5118, 41.6809]);
                  }, 1000);
                }}
              >
                Switzerland vs Rhode Island
              </Button>
            </div>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
};