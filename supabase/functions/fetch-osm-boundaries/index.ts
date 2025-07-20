
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CityQuery {
  name: string;
  country?: string;
  adminLevel?: number;
  relationId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cities }: { cities: CityQuery[] } = await req.json();
    
    if (!cities || !Array.isArray(cities)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Expected array of cities.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching OSM data for ${cities.length} cities`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = [];

    for (const city of cities) {
      try {
        console.log(`Processing: ${city.name}`);
        
        // Get current boundary data for comparison
        const { data: existingBoundary } = await supabase
          .from('boundaries')
          .select('name, geometry_geojson')
          .eq('name', city.name)
          .single();

        const currentPointCount = existingBoundary?.geometry_geojson ? 
          JSON.stringify(existingBoundary.geometry_geojson).length : 0;

        // Build Overpass query for the city - fix the query to include way geometry
        let overpassQuery = '';
        
        if (city.relationId) {
          overpassQuery = `
            [out:json][timeout:120];
            (
              rel(${city.relationId});
              >;
            );
            out geom;
          `;
        } else {
          if (city.name === "New York" || city.name === "New York Metropolitan Area" || city.name === "New York City") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"New York City",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="New York City"]["type"="boundary"];
                rel(175905);
                >;
              );
              out geom;
            `;
          } else if (city.name === "Chicago") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Chicago",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="Chicago"]["type"="boundary"];
                rel(122604);
                >;
              );
              out geom;
            `;
          } else if (city.name === "Los Angeles") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Los Angeles",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Los Angeles"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "Houston") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Houston",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Houston"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "Phoenix") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Phoenix",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Phoenix"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "Philadelphia") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Philadelphia",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Philadelphia"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "San Antonio") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"San Antonio",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of San Antonio"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "San Diego") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"San Diego",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of San Diego"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "Dallas") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Dallas",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Dallas"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else if (city.name === "Austin") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Austin",i]["type"="boundary"]["boundary"="administrative"]["admin_level"="8"];
                rel["name"="City of Austin"]["type"="boundary"];
                >;
              );
              out geom;
            `;
          } else {
            const countryFilter = city.country ? `["ISO3166-1"="${city.country}"]` : '';
            const adminLevelFilter = city.adminLevel ? `["admin_level"="${city.adminLevel}"]` : '';
            
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"${city.name}",i]["type"="boundary"]["boundary"="administrative"]${countryFilter}${adminLevelFilter};
                rel["name"~"${city.name} Metropolitan",i]["type"="boundary"];
                rel["name"~"${city.name} Metro",i]["type"="boundary"];
                rel["name"~"Greater ${city.name}",i]["type"="boundary"];
                >;
              );
              out geom;
            `;
          }
        }

        console.log(`Overpass query for ${city.name}:`, overpassQuery);

        // Query Overpass API
        const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        });

        if (!overpassResponse.ok) {
          console.error(`Overpass API error for ${city.name}:`, overpassResponse.status);
          results.push({
            name: city.name,
            success: false,
            error: `Overpass API error: ${overpassResponse.status}`,
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        const overpassData = await overpassResponse.json();
        console.log(`Found ${overpassData.elements?.length || 0} elements for ${city.name}`);

        if (!overpassData.elements || overpassData.elements.length === 0) {
          console.log(`No boundary data found for ${city.name}`);
          results.push({
            name: city.name,
            success: false,
            error: 'No boundary data found in OSM',
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        // Find the best matching relation
        const relations = overpassData.elements.filter((el: any) => el.type === 'relation');
        if (relations.length === 0) {
          console.log(`No relations found for ${city.name}`);
          results.push({
            name: city.name,
            success: false,
            error: 'No relations found',
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        // Sort by number of members (more detailed boundaries have more members)
        relations.sort((a: any, b: any) => (b.members?.length || 0) - (a.members?.length || 0));
        const bestRelation = relations[0];

        console.log(`Selected relation ${bestRelation.id} for ${city.name} with ${bestRelation.members?.length || 0} members`);

        // Process geometry data more carefully
        const wayMap = new Map();
        const nodeMap = new Map();

        // Index all ways and nodes
        overpassData.elements.forEach((element: any) => {
          if (element.type === 'way') {
            wayMap.set(element.id, element);
          } else if (element.type === 'node') {
            nodeMap.set(element.id, element);
          }
        });

        // Build coordinate ways with better debugging
        const outerWays: number[][][] = [];
        const innerWays: number[][][] = [];

        console.log(`Processing ${bestRelation.members?.length || 0} members for ${city.name}`);

        if (bestRelation.members) {
          for (const member of bestRelation.members) {
            console.log(`Member ${member.ref}: type=${member.type}, role=${member.role || 'none'}`);
            
            if (member.type === 'way') {
              const way = wayMap.get(member.ref);
              if (way) {
                console.log(`Way ${member.ref}: has ${way.geometry?.length || 0} geometry points, ${way.nodes?.length || 0} node refs`);
                
                // Try both geometry (with coordinates) and nodes (references)
                let coords: number[][] = [];
                
                if (way.geometry && way.geometry.length > 0) {
                  // Use direct geometry coordinates
                  coords = way.geometry.map((node: any) => [node.lon, node.lat]);
                } else if (way.nodes && way.nodes.length > 0) {
                  // Build coordinates from node references
                  coords = way.nodes
                    .map((nodeId: number) => nodeMap.get(nodeId))
                    .filter((node: any) => node && node.lat && node.lon)
                    .map((node: any) => [node.lon, node.lat]);
                }
                
                console.log(`Way ${member.ref}: extracted ${coords.length} coordinates`);
                
                if (coords.length > 1) {
                  if (member.role === 'outer' || member.role === '' || !member.role) {
                    outerWays.push(coords);
                  } else if (member.role === 'inner') {
                    innerWays.push(coords);
                  }
                }
              } else {
                console.log(`Way ${member.ref}: not found in wayMap`);
              }
            }
          }
        }

        console.log(`Extracted ${outerWays.length} outer ways and ${innerWays.length} inner ways for ${city.name}`);

        if (outerWays.length === 0) {
          console.log(`No valid outer ways found for ${city.name}`);
          results.push({
            name: city.name,
            success: false,
            error: 'No valid geometry ways found',
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        // Function to connect ways into rings
        function connectWays(ways: number[][][]): number[][][] {
          if (ways.length === 0) return [];
          if (ways.length === 1) {
            // Single way - ensure it's closed
            const way = ways[0];
            if (way.length > 2) {
              const first = way[0];
              const last = way[way.length - 1];
              if (Math.abs(first[0] - last[0]) > 0.0001 || Math.abs(first[1] - last[1]) > 0.0001) {
                // Close the ring
                return [[...way, first]];
              }
              return [way];
            }
            return [];
          }

          // Multiple ways - need to connect them
          const rings: number[][][] = [];
          const unusedWays = [...ways];

          while (unusedWays.length > 0) {
            const ring: number[][] = [];
            let currentWay = unusedWays.shift()!;
            ring.push(...currentWay);

            let connected = true;
            while (connected && unusedWays.length > 0) {
              connected = false;
              const ringEnd = ring[ring.length - 1];

              for (let i = 0; i < unusedWays.length; i++) {
                const way = unusedWays[i];
                const wayStart = way[0];
                const wayEnd = way[way.length - 1];

                // Check if this way connects to the end of the current ring
                if (Math.abs(ringEnd[0] - wayStart[0]) < 0.0001 && Math.abs(ringEnd[1] - wayStart[1]) < 0.0001) {
                  // Connect forward
                  ring.push(...way.slice(1));
                  unusedWays.splice(i, 1);
                  connected = true;
                  break;
                } else if (Math.abs(ringEnd[0] - wayEnd[0]) < 0.0001 && Math.abs(ringEnd[1] - wayEnd[1]) < 0.0001) {
                  // Connect reverse
                  ring.push(...way.slice(0, -1).reverse());
                  unusedWays.splice(i, 1);
                  connected = true;
                  break;
                }
              }
            }

            // Ensure ring is closed
            if (ring.length > 3) {
              const first = ring[0];
              const last = ring[ring.length - 1];
              if (Math.abs(first[0] - last[0]) > 0.0001 || Math.abs(first[1] - last[1]) > 0.0001) {
                ring.push(first);
              }
              rings.push(ring);
            }
          }

          return rings;
        }

        // Connect ways into proper rings
        const outerRings = connectWays(outerWays);
        const innerRings = connectWays(innerWays);

        console.log(`Connected into ${outerRings.length} outer rings and ${innerRings.length} inner rings for ${city.name}`);

        if (outerRings.length === 0) {
          console.log(`No valid outer rings found for ${city.name}`);
          results.push({
            name: city.name,
            success: false,
            error: 'No valid geometry rings found',
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        // Create proper MultiPolygon structure
        // For simplicity, create one polygon with the largest outer ring and all inner rings
        let largestOuter = outerRings[0];
        let maxArea = 0;
        
        // Find the largest outer ring by approximate area
        outerRings.forEach(ring => {
          const bounds = ring.reduce((acc, coord) => ({
            minLng: Math.min(acc.minLng, coord[0]),
            maxLng: Math.max(acc.maxLng, coord[0]),
            minLat: Math.min(acc.minLat, coord[1]),
            maxLat: Math.max(acc.maxLat, coord[1])
          }), { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity });
          
          const area = (bounds.maxLng - bounds.minLng) * (bounds.maxLat - bounds.minLat);
          if (area > maxArea) {
            maxArea = area;
            largestOuter = ring;
          }
        });

        // Create main polygon with largest outer ring and all inner rings
        const mainPolygon = [largestOuter, ...innerRings];
        
        // Add any additional outer rings as separate polygons
        const additionalPolygons = outerRings
          .filter(ring => ring !== largestOuter)
          .map(ring => [ring]);

        const polygons = [mainPolygon, ...additionalPolygons];

        // Quality validation to guard against fragmented data
        function validateBoundaryQuality(polygons: number[][][][]) {
          const totalPolygons = polygons.length;
          const mainPolygonArea = calculatePolygonArea(polygons[0][0]);
          
          // Filter out small fragments (less than 1% of main polygon area)
          const filteredPolygons = polygons.filter((polygon, index) => {
            if (index === 0) return true; // Always keep main polygon
            const area = calculatePolygonArea(polygon[0]);
            return area > mainPolygonArea * 0.01; // Keep if > 1% of main area
          });
          
          const fragmentationRatio = totalPolygons > 1 ? (totalPolygons - filteredPolygons.length) / totalPolygons : 0;
          
          return {
            isValid: filteredPolygons.length <= 10 && fragmentationRatio < 0.8, // Max 10 polygons, < 80% fragments
            filteredPolygons,
            originalCount: totalPolygons,
            filteredCount: filteredPolygons.length,
            fragmentationRatio
          };
        }
        
        function calculatePolygonArea(ring: number[][]): number {
          if (ring.length < 3) return 0;
          let area = 0;
          for (let i = 0; i < ring.length - 1; i++) {
            area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
          }
          return Math.abs(area) / 2;
        }
        
        const qualityCheck = validateBoundaryQuality(polygons);
        
        if (!qualityCheck.isValid) {
          console.log(`Boundary quality check failed for ${city.name}: ${qualityCheck.originalCount} polygons, ${(qualityCheck.fragmentationRatio * 100).toFixed(1)}% fragments`);
          results.push({
            name: city.name,
            success: false,
            error: `Fragmented boundary data: ${qualityCheck.originalCount} polygons with ${(qualityCheck.fragmentationRatio * 100).toFixed(1)}% fragments`,
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }
        
        // Use filtered polygons for final geometry
        const finalPolygons = qualityCheck.filteredPolygons;
        console.log(`Quality check passed for ${city.name}: filtered from ${qualityCheck.originalCount} to ${qualityCheck.filteredCount} polygons`);

        const geoJson = {
          type: "MultiPolygon",
          coordinates: finalPolygons
        };

        // Calculate statistics
        const allCoords = finalPolygons.flat(2);
        const totalPoints = allCoords.length;
        
        if (totalPoints === 0) {
          results.push({
            name: city.name,
            success: false,
            error: 'No coordinate points extracted',
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        const lngs = allCoords.map(coord => coord[0]);
        const lats = allCoords.map(coord => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        const bbox = {
          type: "Polygon",
          coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]]
        };

        // Calculate approximate area
        const areaKm2 = Math.abs((maxLng - minLng) * (maxLat - minLat)) * 111 * 111;

        // Update boundary data with proper PostGIS geometry using RPC call
        const { error: upsertError } = await supabase.rpc('upsert_boundary', {
          boundary_name: city.name,
          geojson_data: geoJson,
          bbox_data: bbox,
          center_lng: centerLng,
          center_lat: centerLat,
          area_km2: areaKm2,
          admin_level: city.adminLevel || null,
          country_code: city.country || null
        });

        if (upsertError) {
          console.error(`Database error for ${city.name}:`, upsertError);
          results.push({
            name: city.name,
            success: false,
            error: `Database error: ${upsertError.message}`,
            beforePoints: currentPointCount,
            afterPoints: 0
          });
          continue;
        }

        results.push({
          name: city.name,
          success: true,
          coordinateCount: totalPoints,
          beforePoints: currentPointCount,
          afterPoints: totalPoints,
          relationId: bestRelation.id,
          areaKm2: Math.round(areaKm2),
          rings: outerRings.length
        });

        console.log(`Successfully processed ${city.name} with ${totalPoints} coordinate points (${outerRings.length} rings)`);

      } catch (error) {
        console.error(`Error processing ${city.name}:`, error);
        results.push({
          name: city.name,
          success: false,
          error: error.message || 'Unknown error',
          beforePoints: 0,
          afterPoints: 0
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Processed ${results.length} cities. ${results.filter(r => r.success).length} successful.` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
