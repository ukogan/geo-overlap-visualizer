import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LocationSearchProps {
  onLocationSelect: (location: string, coordinates: [number, number]) => void;
  placeholder?: string;
  className?: string;
}

export const LocationSearch = ({ onLocationSelect, placeholder = "Search for a location...", className }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim for search to match our boundary data source
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("Nominatim search results:", data);
        
        // Transform Nominatim results to our format
        const transformedResults = data.map((item: any) => ({
          place_name: item.display_name,
          center: [parseFloat(item.lon), parseFloat(item.lat)],
          id: item.place_id,
          osm_type: item.osm_type,
          osm_id: item.osm_id
        }));
        
        setSuggestions(transformedResults);
      }
    } catch (error) {
      console.error("Error searching locations with Nominatim:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    searchLocations(value);
  };

  const handleLocationClick = (location: any) => {
    onLocationSelect(location.place_name, location.center);
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
          {suggestions.map((location) => (
            <Button
              key={location.id || location.place_name}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3 hover:bg-secondary"
              onClick={() => handleLocationClick(location)}
            >
              <MapPin className="h-4 w-4 mr-2 text-map-blue flex-shrink-0" />
              <span className="truncate">{location.place_name}</span>
            </Button>
          ))}
        </Card>
      )}
    </div>
  );
};