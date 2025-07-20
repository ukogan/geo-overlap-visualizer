import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LocationSearch } from "./LocationSearch";
import { OSMFetchStatus } from "./OSMFetchStatus";
import { RefreshCcw, Map, Layers, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [isLoadingOSM, setIsLoadingOSM] = useState(false);
  const [fetchResults, setFetchResults] = useState<any[]>([]);
  const { toast } = useToast();

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

  const fetchOSMBoundaries = async () => {
    if (isLoadingOSM) return;
    
    setIsLoadingOSM(true);
    setFetchResults([]); // Clear previous results
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-osm-boundaries', {
        body: {
          cities: [
            {
              name: "New York",
              country: "US",
              adminLevel: 4
            },
            {
              name: "Chicago", 
              country: "US",
              adminLevel: 4
            }
          ]
        }
      });

      if (error) {
        console.error('OSM fetch error:', error);
        throw new Error(error.message || 'Failed to fetch OSM data');
      }

      console.log('OSM fetch response:', data);
      
      const results = data?.results || [];
      setFetchResults(results);
      onOsmResults(results);
      
      const successCount = results.filter((r: OSMFetchResult) => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "OSM Data Updated",
        description: `Successfully fetched detailed boundary data for ${successCount}/${totalCount} cities`,
      });

      // Trigger map refresh to reload boundary data
      if (successCount > 0) {
        onBoundaryDataRefresh();
      }

    } catch (error) {
      console.error('Error fetching OSM boundaries:', error);
      const errorResults: OSMFetchResult[] = [
        { name: "New York", success: false, error: error.message },
        { name: "Chicago", success: false, error: error.message }
      ];
      setFetchResults(errorResults);
      onOsmResults(errorResults);
      
      toast({
        title: "Error",
        description: "Failed to fetch OSM boundary data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOSM(false);
    }
  };

  const fetchTop10USCities = async () => {
    if (isLoadingOSM) return;
    
    setIsLoadingOSM(true);
    setFetchResults([]); // Clear previous results
    
    try {
      const top10USCities = [
        { name: "New York City", country: "US", adminLevel: 8 },
        { name: "Los Angeles", country: "US", adminLevel: 8 },
        { name: "Chicago", country: "US", adminLevel: 8 },
        { name: "Houston", country: "US", adminLevel: 8 },
        { name: "Phoenix", country: "US", adminLevel: 8 },
        { name: "Philadelphia", country: "US", adminLevel: 8 },
        { name: "San Antonio", country: "US", adminLevel: 8 },
        { name: "San Diego", country: "US", adminLevel: 8 },
        { name: "Dallas", country: "US", adminLevel: 8 },
        { name: "Austin", country: "US", adminLevel: 8 }
      ];

      const { data, error } = await supabase.functions.invoke('fetch-osm-boundaries', {
        body: {
          cities: top10USCities
        }
      });

      if (error) {
        console.error('OSM fetch error:', error);
        throw new Error(error.message || 'Failed to fetch OSM data');
      }

      console.log('Top 10 US cities fetch response:', data);
      
      const results = data?.results || [];
      setFetchResults(results);
      onOsmResults(results);
      
      const successCount = results.filter((r: OSMFetchResult) => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Top 10 US Cities Updated",
        description: `Successfully fetched boundary data for ${successCount}/${totalCount} cities`,
      });

      // Trigger map refresh to reload boundary data
      if (successCount > 0) {
        onBoundaryDataRefresh();
      }

    } catch (error) {
      console.error('Error fetching top 10 US cities:', error);
      const errorResults: OSMFetchResult[] = [
        { name: "Top 10 US Cities", success: false, error: error.message }
      ];
      setFetchResults(errorResults);
      onOsmResults(errorResults);
      
      toast({
        title: "Error",
        description: "Failed to fetch top 10 US cities data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOSM(false);
    }
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
        {/* OSM Data Update Button */}
        <div className="space-y-3">
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Update Boundary Data</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchOSMBoundaries}
              disabled={isLoadingOSM}
              className="w-full text-xs h-8"
            >
              {isLoadingOSM ? "Fetching..." : "Fetch Detailed OSM Data (NY & Chicago)"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTop10USCities}
              disabled={isLoadingOSM}
              className="w-full text-xs h-8 mt-2"
            >
              {isLoadingOSM ? "Fetching..." : "Fetch Top 10 US Cities"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Bulk fetch boundary data for major US cities for easy comparison
            </p>
          </div>
        </div>

        <OSMFetchStatus results={fetchResults} />

        <Separator />

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
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-8"
                onClick={() => {
                  handleBaseLocationSelect("New York", [74.0059, 40.7128]);
                  setTimeout(() => {
                    handleOverlayLocationSelect("Chicago", [-87.6298, 41.8781]);
                  }, 1000);
                }}
              >
                New York vs Chicago
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