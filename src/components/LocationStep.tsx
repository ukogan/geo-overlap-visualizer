import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationSearch } from "./LocationSearch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Map, Download, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Suggestion {
  name: string;
  coordinates: [number, number];
  id: string;
  area_km2?: number;
}

interface LocationStepProps {
  stepNumber: number;
  title: string;
  description: string;
  color: "blue" | "green";
  placeholder: string;
  selectedLocation?: string;
  onLocationSelect: (location: string, coordinates: [number, number], boundaryId?: number) => void;
  isActive?: boolean;
}

export const LocationStep = ({
  stepNumber,
  title,
  description,
  color,
  placeholder,
  selectedLocation,
  onLocationSelect,
  isActive = false
}: LocationStepProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{name: string, coordinates: [number, number], searchResult?: any, triedSuggestion?: boolean} | null>(null);
  const { toast } = useToast();

  const colorClasses = {
    blue: {
      badge: "bg-map-blue/10 text-map-blue border-map-blue/20",
      button: "bg-map-blue hover:bg-map-blue/90",
      icon: "text-map-blue"
    },
    green: {
      badge: "bg-map-green/10 text-map-green border-map-green/20", 
      button: "bg-map-green hover:bg-map-green/90",
      icon: "text-map-green"
    }
  };

  const checkExistingData = async (locationName: string) => {
    try {
      // Normalize the search term better
      const normalizedSearch = locationName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
      
      // Check for exact and similar matches using the original search method
      const { data, error } = await supabase.functions.invoke('search-boundaries', {
        body: { query: locationName }
      });

      if (error) {
        console.error('Search error:', error);
        return {};
      }

      const results = data.features || [];
      
      
      if (results.length > 0) {
        // Separate local vs external results
        const localResults = results.filter((result: any) => result.id !== null && result.source === 'local');
        const externalResults = results.filter((result: any) => result.source === 'external');
        
        if (localResults.length > 0) {
          // If we found local results, use them
          return {
            existing: localResults.map((result: any) => ({
              name: result.name || result.place_name,
              coordinates: result.center || [
                result.bbox ? (result.bbox[0] + result.bbox[2]) / 2 : 0, 
                result.bbox ? (result.bbox[1] + result.bbox[3]) / 2 : 0
              ] as [number, number],
              id: result.id.toString(),
              area_km2: result.area_km2
            })),
            searchResults: results
          };
        }
        
        // If only external results, return them for download
        return { searchResults: results };
      }

      return {};
    } catch (error) {
      console.error('Error checking existing data:', error);
      return {};
    }
  };

  const handleLocationSearch = async (location: string, coordinates: [number, number]) => {
    const existingData = await checkExistingData(location);

    if (existingData.existing && existingData.existing.length > 0) {
      // Use the first existing match
      const match = existingData.existing[0];
      onLocationSelect(match.name, match.coordinates, parseInt(match.id));
      toast({
        title: "Using existing data",
        description: `${match.name} is already available in the database`,
      });
      return;
    }

    // If we have search results, store the first one for download
    const searchResult = existingData.searchResults?.[0];
    
    // No existing data, prompt for download
    setPendingLocation({ 
      name: location, 
      coordinates,
      searchResult // Store the search result with OSM data
    });
    setShowDownloadPrompt(true);
  };

  const handleDownload = async () => {
    if (!pendingLocation) return;

    setIsDownloading(true);
    try {
      const cityData: any = {
        name: pendingLocation.name.split(',')[0].trim(),
        country: "US", // Default to US for now
        adminLevel: 8
      };

      // If we have search result with OSM data, include it
      if (pendingLocation.searchResult) {
        cityData.osmId = pendingLocation.searchResult.osm_id;
        cityData.osmType = pendingLocation.searchResult.osm_type;
        if (pendingLocation.searchResult.osm_type === 'relation') {
          cityData.relationId = pendingLocation.searchResult.osm_id;
        }
      }

      const { data, error } = await supabase.functions.invoke('fetch-osm-boundaries', {
        body: { cities: [cityData] }
      });

      if (error) throw error;

      const results = data?.results || [];
      const successfulResult = results.find((r: any) => r.success);

      if (successfulResult) {
        // Fetch the newly saved data
        const { data: newData } = await supabase
          .from('city_boundaries')
          .select('id, name, center_lat, center_lng')
          .eq('normalized_name', pendingLocation.name.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
          .single();

        if (newData) {
          onLocationSelect(newData.name, [newData.center_lng, newData.center_lat], parseInt(newData.id));
          toast({
            title: "Download complete",
            description: `${newData.name} boundary data has been downloaded and is now available`,
          });
        } else {
          onLocationSelect(pendingLocation.name, pendingLocation.coordinates);
        }
      } else {
        // Check if there are suggestions in the failed result
        const failedResult = results[0];
        if (failedResult?.suggestions && failedResult.suggestions.length > 0 && !pendingLocation.triedSuggestion) {
          const suggestion = failedResult.suggestions[0];
          toast({
            title: "Location not found",
            description: `Trying alternative: ${suggestion}`,
          });
          
          // Update pending location with suggestion and mark as tried
          setPendingLocation(prev => ({
            ...prev!,
            name: suggestion,
            triedSuggestion: true
          }));
          
          // Try the suggestion but avoid infinite loop
          const suggestionCityData = {
            name: suggestion,
            country: "US",
            adminLevel: 8
          };
          
          const { data: suggestionData, error: suggestionError } = await supabase.functions.invoke('fetch-osm-boundaries', {
            body: { cities: [suggestionCityData] }
          });
          
          if (!suggestionError && suggestionData?.results?.find((r: any) => r.success)) {
            // If suggestion worked, proceed normally
            const successResult = suggestionData.results.find((r: any) => r.success);
            const { data: newData } = await supabase
              .from('city_boundaries')
              .select('id, name, center_lat, center_lng')
              .eq('normalized_name', suggestion.toLowerCase().replace(/[^a-z0-9]/g, ''))
              .single();
              
            if (newData) {
              onLocationSelect(newData.name, [newData.center_lng, newData.center_lat], parseInt(newData.id));
              toast({
                title: "Download complete",
                description: `${newData.name} boundary data has been downloaded`,
              });
            } else {
              onLocationSelect(suggestion, pendingLocation.coordinates);
            }
          } else {
            // Suggestion also failed, use point location
            throw new Error('Alternative location also not found');
          }
        } else {
          throw new Error(failedResult?.error || 'Failed to download boundary data');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download boundary data. Using point location instead.",
        variant: "destructive"
      });
      
      // Fallback to point location
      onLocationSelect(pendingLocation.name, pendingLocation.coordinates);
    } finally {
      setIsDownloading(false);
      setShowDownloadPrompt(false);
      setPendingLocation(null);
      setSuggestions([]);
    }
  };

  const handleUseSuggestion = (suggestion: Suggestion) => {
    onLocationSelect(suggestion.name, suggestion.coordinates, parseInt(suggestion.id));
    setShowDownloadPrompt(false);
    setPendingLocation(null);
    setSuggestions([]);
    toast({
      title: "Using existing data",
      description: `${suggestion.name} is already available in the database`,
    });
  };

  const handleSkipDownload = () => {
    if (pendingLocation) {
      onLocationSelect(pendingLocation.name, pendingLocation.coordinates);
      toast({
        title: "Using point location",
        description: "Boundary data not downloaded. Using point location for comparison.",
      });
    }
    setShowDownloadPrompt(false);
    setPendingLocation(null);
    setSuggestions([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
          {stepNumber}
        </Badge>
        <span className="text-sm font-medium">{title}</span>
        {selectedLocation && (
          <Badge variant="outline" className={`text-xs ${colorClasses[color].badge}`}>
            {selectedLocation.split(',')[0]}
          </Badge>
        )}
      </div>

      <LocationSearch
        onLocationSelect={handleLocationSearch}
        placeholder={placeholder}
        className="w-full"
      />

      <p className="text-xs text-muted-foreground">
        {description}
      </p>

      {/* Download Prompt */}
      {showDownloadPrompt && (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              {suggestions.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">Similar locations already available:</p>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{suggestion.name}</span>
                          {suggestion.area_km2 && (
                            <span className="text-xs text-muted-foreground">
                              ({suggestion.area_km2.toFixed(0)} km²)
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="ml-2 flex-shrink-0"
                        >
                          Use this
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-2">Or download specific data for "{pendingLocation?.name}":</p>
                </div>
              ) : (
                <p className="text-sm">
                  Boundary data for "{pendingLocation?.name}" is not available. Download it now?
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button 
                  size="sm" 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`${colorClasses[color].button} flex-1`}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Download (10-30s)
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSkipDownload}
                  disabled={isDownloading}
                  className="flex-1"
                >
                  Use point location
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};