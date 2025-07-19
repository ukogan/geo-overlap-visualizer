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
      // Using Mapbox Geocoding API - will need actual token in production
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=YOUR_MAPBOX_TOKEN&types=place,region,country&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.features || []);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      // Fallback to mock data for demo
      setSuggestions([
        {
          place_name: "Tokyo, Japan",
          center: [139.6917, 35.6895],
          id: "tokyo"
        },
        {
          place_name: "San Francisco Bay Area, California, United States",
          center: [-122.4194, 37.7749],
          id: "bay-area"
        },
        {
          place_name: "Switzerland",
          center: [8.2275, 46.8182],
          id: "switzerland"
        },
        {
          place_name: "Rhode Island, United States",
          center: [-71.5118, 41.6809],
          id: "rhode-island"
        }
      ].filter(item => 
        item.place_name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
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