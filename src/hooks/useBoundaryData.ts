
import { useState, useCallback } from 'react';
import { getBoundaryData, searchBoundaries, BoundarySearchResult } from '@/lib/supabaseBoundaryService';
import { LocationBounds } from '@/lib/supabaseBoundaryService';

export interface BoundaryState {
  id?: number;
  name: string;
  coordinates: [number, number];
  bounds?: LocationBounds;
  isLoading: boolean;
  lastUpdated?: string;
}

export interface OSMFetchResult {
  name: string;
  success: boolean;
  coordinateCount?: number;
  beforePoints?: number;
  afterPoints?: number;
  error?: string;
  rings?: number;
  areaKm2?: number;
  relationId?: string;
  message?: string;
  suggestions?: string[];
  existing?: boolean;
}

export function useBoundaryData() {
  const [baseLocation, setBaseLocation] = useState<BoundaryState | null>(null);
  const [overlayLocation, setOverlayLocation] = useState<BoundaryState | null>(null);
  const [searchResults, setSearchResults] = useState<BoundarySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [osmFetchResults, setOsmFetchResults] = useState<OSMFetchResult[]>([]);

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchBoundaries(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching boundaries:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectBaseLocation = useCallback(async (name: string, coordinates: [number, number], id?: number) => {
    setBaseLocation({
      id,
      name,
      coordinates,
      isLoading: true,
      lastUpdated: new Date().toISOString()
    });

    try {
      const bounds = await getBoundaryData(id || null, name);
      setBaseLocation(prev => prev ? { 
        ...prev, 
        bounds, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error loading base boundary:', error);
      setBaseLocation(prev => prev ? { ...prev, isLoading: false } : null);
    }
  }, []);

  const selectOverlayLocation = useCallback(async (name: string, coordinates: [number, number], id?: number) => {
    setOverlayLocation({
      id,
      name,
      coordinates,
      isLoading: true,
      lastUpdated: new Date().toISOString()
    });

    try {
      const bounds = await getBoundaryData(id || null, name);
      setOverlayLocation(prev => prev ? { 
        ...prev, 
        bounds, 
        isLoading: false,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error loading overlay boundary:', error);
      setOverlayLocation(prev => prev ? { ...prev, isLoading: false } : null);
    }
  }, []);

  const resetLocations = useCallback(() => {
    setBaseLocation(null);
    setOverlayLocation(null);
    setSearchResults([]);
    setOsmFetchResults([]);
  }, []);

  const refreshBoundaryData = useCallback(async () => {
    console.log('Refreshing boundary data...');
    
    // Force reload both locations if they exist
    if (baseLocation && !baseLocation.isLoading) {
      console.log('Refreshing base location:', baseLocation.name);
      setBaseLocation(prev => prev ? { ...prev, isLoading: true } : null);
      
      try {
        const bounds = await getBoundaryData(baseLocation.id || null, baseLocation.name);
        setBaseLocation(prev => prev ? { 
          ...prev, 
          bounds, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        } : null);
        console.log('Base location refreshed successfully');
      } catch (error) {
        console.error('Error refreshing base boundary:', error);
        setBaseLocation(prev => prev ? { ...prev, isLoading: false } : null);
      }
    }

    if (overlayLocation && !overlayLocation.isLoading) {
      console.log('Refreshing overlay location:', overlayLocation.name);
      setOverlayLocation(prev => prev ? { ...prev, isLoading: true } : null);
      
      try {
        const bounds = await getBoundaryData(overlayLocation.id || null, overlayLocation.name);
        setOverlayLocation(prev => prev ? { 
          ...prev, 
          bounds, 
          isLoading: false,
          lastUpdated: new Date().toISOString()
        } : null);
        console.log('Overlay location refreshed successfully');
      } catch (error) {
        console.error('Error refreshing overlay boundary:', error);
        setOverlayLocation(prev => prev ? { ...prev, isLoading: false } : null);
      }
    }
  }, [baseLocation, overlayLocation]);

  const setOsmResults = useCallback((results: OSMFetchResult[]) => {
    console.log('Setting OSM results:', results);
    setOsmFetchResults(results);
  }, []);

  const swapLocations = useCallback(() => {
    if (baseLocation && overlayLocation) {
      const tempBase = baseLocation;
      setBaseLocation(overlayLocation);
      setOverlayLocation(tempBase);
      return true; // Return true to indicate successful swap
    }
    return false; // Return false if can't swap
  }, [baseLocation, overlayLocation]);

  return {
    baseLocation,
    overlayLocation,
    searchResults,
    isSearching,
    osmFetchResults,
    searchLocations,
    selectBaseLocation,
    selectOverlayLocation,
    resetLocations,
    refreshBoundaryData,
    setOsmResults,
    swapLocations
  };
}
