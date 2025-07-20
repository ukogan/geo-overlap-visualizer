
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

        // Build Overpass query for the city
        let overpassQuery = '';
        
        if (city.relationId) {
          overpassQuery = `
            [out:json][timeout:120];
            rel(${city.relationId});
            out geom;
          `;
        } else {
          if (city.name === "New York") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"New York",i]["type"="boundary"]["boundary"="administrative"]["admin_level"~"[4-6]"];
                rel["name"~"New York Metropolitan",i]["type"="boundary"];
                rel["name"~"Greater New York",i]["type"="boundary"];
                rel(175905);
              );
              out geom;
            `;
          } else if (city.name === "Chicago") {
            overpassQuery = `
              [out:json][timeout:120];
              (
                rel["name"~"Chicago",i]["type"="boundary"]["boundary"="administrative"]["admin_level"~"[4-6]"];
                rel["name"~"Chicago Metropolitan",i]["type"="boundary"];
                rel["name"~"Greater Chicago",i]["type"="boundary"];
                rel(122604);
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

        // Build coordinate rings
        const outerRings: number[][][] = [];
        const innerRings: number[][][] = [];

        if (bestRelation.members) {
          for (const member of bestRelation.members) {
            if (member.type === 'way') {
              const way = wayMap.get(member.ref);
              if (way && way.geometry && way.geometry.length > 2) {
                const coords = way.geometry.map((node: any) => [node.lon, node.lat]);
                
                if (member.role === 'outer' || member.role === '' || !member.role) {
                  outerRings.push(coords);
                } else if (member.role === 'inner') {
                  innerRings.push(coords);
                }
              }
            }
          }
        }

        console.log(`Extracted ${outerRings.length} outer rings and ${innerRings.length} inner rings for ${city.name}`);

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
        const polygons = outerRings.map(outerRing => {
          const polygon = [outerRing];
          // Add any inner rings that might belong to this outer ring
          innerRings.forEach(innerRing => {
            polygon.push(innerRing);
          });
          return polygon;
        });

        const geoJson = {
          type: "MultiPolygon",
          coordinates: polygons
        };

        // Calculate statistics
        const allCoords = polygons.flat(2);
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

        // Update boundary data with proper PostGIS geometry
        const { error: upsertError } = await supabase
          .from('boundaries')
          .upsert({
            name: city.name,
            geometry_geojson: geoJson,
            bbox_geojson: bbox,
            center_lng: centerLng,
            center_lat: centerLat,
            area_km2: areaKm2,
            admin_level: city.adminLevel || null,
            country_code: city.country || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name'
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
