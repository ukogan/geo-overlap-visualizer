import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Database, MapPin, Calendar, Trash2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  const [loadingStates, setLoadingStates] = useState<Record<string, 'deleting' | 'refreshing' | null>>({});
  const { toast } = useToast();

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
      // The data structure is nested: boundary_data.boundary.geometry
      const geometry = boundaryData.boundary?.geometry;
      if (!geometry) return 0;
      
      if (geometry.type === 'Polygon') {
        return geometry.coordinates?.[0]?.length || 0;
      } else if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates?.reduce((total: number, polygon: any) => {
          return total + (polygon[0]?.length || 0);
        }, 0) || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const handleUseLocation = (city: CityData, action: 'base' | 'overlay' = 'base') => {
    if (onLocationSelect && city.center_lat && city.center_lng) {
      onLocationSelect(city.name, [city.center_lng, city.center_lat], parseInt(city.id));
    }
  };

  const handleDeleteCity = async (city: CityData) => {
    setLoadingStates(prev => ({ ...prev, [city.id]: 'deleting' }));
    
    try {
      const { error } = await supabase
        .from('city_boundaries')
        .delete()
        .eq('id', city.id);

      if (error) throw error;

      setCities(prev => prev.filter(c => c.id !== city.id));
      toast({
        title: "City deleted",
        description: `${city.name} has been removed from the database.`,
      });
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Error deleting city",
        description: "There was an error removing the city from the database.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [city.id]: null }));
    }
  };

  const handleRefreshCity = async (city: CityData) => {
    setLoadingStates(prev => ({ ...prev, [city.id]: 'refreshing' }));
    
    try {
      // First delete the existing entry
      const { error: deleteError } = await supabase
        .from('city_boundaries')
        .delete()
        .eq('id', city.id);

      if (deleteError) throw deleteError;

      // Re-download the data
      const { data, error } = await supabase.functions.invoke('fetch-osm-boundaries', {
        body: {
          cities: [{
            name: city.name,
            country: city.country_code || "US",
            adminLevel: city.admin_level || 8
          }]
        }
      });

      if (error) throw error;

      // Refresh the cities list
      await fetchCities();
      
      toast({
        title: "City refreshed",
        description: `${city.name} boundary data has been re-downloaded.`,
      });
    } catch (error) {
      console.error('Error refreshing city:', error);
      toast({
        title: "Error refreshing city",
        description: "There was an error re-downloading the boundary data.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [city.id]: null }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Database Locations</h2>
          <p className="text-muted-foreground">Manage and explore your downloaded boundary data</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading cities...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Database Locations</h2>
        <p className="text-muted-foreground">
          Manage and explore your downloaded boundary data ({cities.length} cities available)
        </p>
      </div>

      {cities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cities in database</h3>
            <p className="text-muted-foreground mb-4">
              Switch to the Geographic Comparison tab to download boundary data for cities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Card 
              key={city.id} 
              className={`transition-colors hover:bg-muted/50 ${
                selectedLocationId === parseInt(city.id) 
                  ? 'border-primary bg-primary/5' 
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{city.name}</h4>
                        {city.country_code && (
                          <Badge variant="outline" className="text-xs">
                            {city.country_code}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {city.area_km2 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {city.area_km2.toFixed(0)} km²
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {getPointCount(city.boundary_data).toLocaleString()} pts
                        </div>
                        {city.population && (
                          <div className="col-span-2">
                            Pop: {city.population.toLocaleString()}
                          </div>
                        )}
                        <div className="col-span-2 flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(city.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {onLocationSelect && city.center_lat && city.center_lng && (
                      <Button 
                        onClick={() => handleUseLocation(city)}
                        className="w-full"
                        size="sm"
                      >
                        <MapPin className="h-3 w-3 mr-2" />
                        Use for Comparison
                      </Button>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRefreshCity(city)}
                        disabled={loadingStates[city.id] === 'refreshing'}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {loadingStates[city.id] === 'refreshing' ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteCity(city)}
                        disabled={loadingStates[city.id] === 'deleting'}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        {loadingStates[city.id] === 'deleting' ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};