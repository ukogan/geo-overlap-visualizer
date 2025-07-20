import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BoundaryState } from "@/hooks/useBoundaryData";
import { Ruler, MapPin, Globe, Layers } from "lucide-react";

interface LocationStatsProps {
  baseLocation?: BoundaryState | null;
  overlayLocation?: BoundaryState | null;
}

export const LocationStats = ({ baseLocation, overlayLocation }: LocationStatsProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getLocationStats = (location: BoundaryState | null) => {
    if (!location) return null;

    const stats = [];
    
    // Area
    if (location.bounds?.areaKm2) {
      stats.push({
        icon: Globe,
        label: "Area",
        value: `${formatNumber(location.bounds.areaKm2)} km²`
      });
    }

    // Population
    if (location.bounds?.population) {
      stats.push({
        icon: MapPin,
        label: "Population",
        value: formatNumber(location.bounds.population)
      });
    }

    // Boundary points
    if (location.bounds?.coordinateCount) {
      stats.push({
        icon: Layers,
        label: "Boundary Points",
        value: formatNumber(location.bounds.coordinateCount)
      });
    }

    // Perimeter (if available)
    if (location.bounds?.perimeterKm) {
      stats.push({
        icon: Ruler,
        label: "Perimeter",
        value: `${formatNumber(location.bounds.perimeterKm)} km`
      });
    }

    return stats;
  };

  const baseStats = getLocationStats(baseLocation);
  const overlayStats = getLocationStats(overlayLocation);

  // Calculate comparison ratios
  const getComparison = () => {
    if (!baseLocation?.bounds?.areaKm2 || !overlayLocation?.bounds?.areaKm2) return null;
    
    const ratio = overlayLocation.bounds.areaKm2 / baseLocation.bounds.areaKm2;
    if (ratio > 1) {
      return `${ratio.toFixed(1)}× larger`;
    } else {
      return `${(1/ratio).toFixed(1)}× smaller`;
    }
  };

  const comparison = getComparison();

  if (!baseLocation && !overlayLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select locations to see detailed statistics and comparisons
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Location Statistics</CardTitle>
        {comparison && (
          <Badge variant="outline" className="w-fit">
            Overlay is {comparison} than base
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Base Location Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-map-blue rounded-full"></div>
              <h3 className="font-medium text-sm">
                {baseLocation ? baseLocation.name.split(',')[0] : 'Base Location'}
              </h3>
              {baseLocation?.isLoading && (
                <div className="w-3 h-3 border border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              )}
            </div>
            
            {baseStats ? (
              <div className="space-y-2">
                {baseStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <stat.icon className="h-3 w-3" />
                      {stat.label}
                    </div>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : baseLocation ? (
              <p className="text-sm text-muted-foreground">
                {baseLocation.isLoading ? 'Loading statistics...' : 'Limited data available'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No base location selected</p>
            )}
          </div>

          {/* Overlay Location Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-map-green rounded-full"></div>
              <h3 className="font-medium text-sm">
                {overlayLocation ? overlayLocation.name.split(',')[0] : 'Overlay Location'}
              </h3>
              {overlayLocation?.isLoading && (
                <div className="w-3 h-3 border border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              )}
            </div>
            
            {overlayStats ? (
              <div className="space-y-2">
                {overlayStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <stat.icon className="h-3 w-3" />
                      {stat.label}
                    </div>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : overlayLocation ? (
              <p className="text-sm text-muted-foreground">
                {overlayLocation.isLoading ? 'Loading statistics...' : 'Limited data available'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No overlay location selected</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};