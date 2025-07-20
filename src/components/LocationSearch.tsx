import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { searchBoundaries, BoundarySearchResult } from "@/lib/supabaseBoundaryService";

interface LocationSearchProps {
  onLocationSelect: (location: string, coordinates: [number, number], boundaryId?: number) => void;
  placeholder?: string;
  className?: string;
}

export const LocationSearch = ({ onLocationSelect, placeholder = "Search for a location...", className }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BoundarySearchResult[]>([]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use our Supabase-hosted boundary data
      const results = await searchBoundaries(searchQuery);
      console.log("Boundary search results:", results);
      setSuggestions(results);
    } catch (error) {
      console.error("Error searching boundaries:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    searchLocations(value);
  };

  const handleLocationClick = (location: BoundarySearchResult) => {
    // Use provided center coordinates, or calculate from bbox, or fallback
    let center: [number, number];
    
    if (location.center) {
      center = location.center;
    } else if (location.bbox?.coordinates?.[0]) {
      center = [
        (Math.min(...location.bbox.coordinates[0].map((c: number[]) => c[0])) + 
         Math.max(...location.bbox.coordinates[0].map((c: number[]) => c[0]))) / 2,
        (Math.min(...location.bbox.coordinates[0].map((c: number[]) => c[1])) + 
         Math.max(...location.bbox.coordinates[0].map((c: number[]) => c[1]))) / 2
      ];
    } else {
      center = [0, 0]; // fallback
    }
    
    onLocationSelect(location.place_name, center, location.id);
    setQuery(location.place_name);
    setSuggestions([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      
      {suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          {suggestions.map((location, index) => (
            <Button
              key={location.id || `external-${index}`}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 hover:bg-secondary"
              onClick={() => handleLocationClick(location)}
            >
              <MapPin className="h-4 w-4 mr-2 text-map-blue flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="truncate font-medium">
                  {location.name}
                  {location.source === 'local' && <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">Downloaded</span>}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {location.country_code ? `${location.country_code.toUpperCase()} • ` : ''}
                  Level {location.admin_level}
                  {location.area_km2 && ` • ${location.area_km2.toFixed(0)} km²`}
                </span>
              </div>
            </Button>
          ))}
        </Card>
      )}
    </div>
  );
};