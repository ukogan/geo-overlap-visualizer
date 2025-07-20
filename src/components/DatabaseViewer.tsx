import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Database, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CityData {
  id: string;
  name: string;
  area_km2?: number;
  population?: number;
  admin_level?: number;
  country_code?: string;
  center_lat?: number;
  center_lng?: number;
  created_at: string;
  boundary_data: any;
}

interface DatabaseViewerProps {
  onLocationSelect?: (name: string, coordinates: [number, number], id: number) => void;
  selectedLocationId?: number;
}

export const DatabaseViewer = ({ onLocationSelect, selectedLocationId }: DatabaseViewerProps) => {
  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('city_boundaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointCount = (boundaryData: any) => {
    if (!boundaryData) return 0;
    
    try {
      if (boundaryData.type === 'Polygon') {
        return boundaryData.coordinates?.[0]?.length || 0;
      } else if (boundaryData.type === 'MultiPolygon') {
        return boundaryData.coordinates?.reduce((total: number, polygon: any) => {
          return total + (polygon[0]?.length || 0);
        }, 0) || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const handleUseLocation = (city: CityData) => {
    if (onLocationSelect && city.center_lat && city.center_lng) {
      onLocationSelect(city.name, [city.center_lng, city.center_lat], parseInt(city.id));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Cities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading cities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Cities ({cities.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cities with boundary data available for comparison
        </p>
      </CardHeader>
      <CardContent>
        {cities.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No cities in database yet. Download some boundary data to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cities.map((city) => (
              <div 
                key={city.id} 
                className={`p-3 border rounded-lg space-y-2 transition-colors ${
                  selectedLocationId === parseInt(city.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{city.name}</h4>
                      {city.country_code && (
                        <Badge variant="outline" className="text-xs">
                          {city.country_code}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {city.area_km2 && (
                        <div>Area: {city.area_km2.toFixed(0)} km²</div>
                      )}
                      <div>Points: {getPointCount(city.boundary_data).toLocaleString()}</div>
                      {city.population && (
                        <div>Pop: {city.population.toLocaleString()}</div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(city.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  {onLocationSelect && city.center_lat && city.center_lng && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUseLocation(city)}
                      className="ml-2"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};