import { Badge } from "@/components/ui/badge";
import { OSMFetchResult } from "@/hooks/useBoundaryData";

interface OSMFetchStatusProps {
  results: OSMFetchResult[];
}

export const OSMFetchStatus = ({ results }: OSMFetchStatusProps) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Results
        </Badge>
        <span className="text-sm font-medium">OSM Data Fetched</span>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
            <span className="font-medium">{result.name}</span>
            {result.success ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                {result.coordinateCount?.toLocaleString() || 0} points
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                Failed: {result.error || 'Unknown error'}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};