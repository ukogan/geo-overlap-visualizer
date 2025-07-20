
import { Badge } from "@/components/ui/badge";
import { OSMFetchResult } from "@/hooks/useBoundaryData";
import { ArrowRight, MapPin, Activity } from "lucide-react";

interface OSMFetchStatusProps {
  results: OSMFetchResult[];
}

export const OSMFetchStatus = ({ results }: OSMFetchStatusProps) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">OSM Data Fetch Results</span>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-3 bg-muted/20 rounded border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">{result.name}</span>
              </div>
              {result.success ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Success
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Failed
                </Badge>
              )}
            </div>
            
            {result.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Points:</span>
                  <span className="text-muted-foreground">{result.beforePoints?.toLocaleString() || 0}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-green-600">{result.afterPoints?.toLocaleString() || 0}</span>
                </div>
                {result.rings && (
                  <div className="text-xs text-muted-foreground">
                    <span>Rings: {result.rings}</span>
                  </div>
                )}
                {result.areaKm2 && (
                  <div className="text-xs text-muted-foreground">
                    <span>Area: {result.areaKm2.toLocaleString()} km²</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-red-600">
                {result.error || 'Unknown error'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {results.length > 0 && (
        <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50/50 rounded border border-blue-200/50">
          💡 Higher point counts indicate more detailed boundary data. Map will refresh automatically with updated boundaries.
        </div>
      )}
    </div>
  );
};
