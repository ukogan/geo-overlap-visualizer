import { useState, useCallback } from 'react';
import { getBoundaryData, searchBoundaries, BoundarySearchResult } from '@/lib/supabaseBoundaryService';
import { LocationBounds } from '@/lib/supabaseBoundaryService';

export interface BoundaryState {
  id?: number;
  name: string;
  coordinates: [number, number];
  bounds?: LocationBounds;
  isLoading: boolean;
}

export interface OSMFetchResult {
  name: string;
  success: boolean;
  coordinateCount?: number;
  error?: string;
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
      isLoading: true
    });

    try {
      const bounds = await getBoundaryData(id || null, name);
      setBaseLocation(prev => prev ? { ...prev, bounds, isLoading: false } : null);
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
      isLoading: true
    });

    try {
      const bounds = await getBoundaryData(id || null, name);
      setOverlayLocation(prev => prev ? { ...prev, bounds, isLoading: false } : null);
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
    // Reload current boundary data to pick up any OSM updates
    if (baseLocation && !baseLocation.isLoading) {
      try {
        const bounds = await getBoundaryData(baseLocation.id || null, baseLocation.name);
        setBaseLocation(prev => prev ? { ...prev, bounds } : null);
      } catch (error) {
        console.error('Error refreshing base boundary:', error);
      }
    }

    if (overlayLocation && !overlayLocation.isLoading) {
      try {
        const bounds = await getBoundaryData(overlayLocation.id || null, overlayLocation.name);
        setOverlayLocation(prev => prev ? { ...prev, bounds } : null);
      } catch (error) {
        console.error('Error refreshing overlay boundary:', error);
      }
    }
  }, [baseLocation, overlayLocation]);

  const setOsmResults = useCallback((results: OSMFetchResult[]) => {
    setOsmFetchResults(results);
  }, []);

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
    setOsmResults
  };
}