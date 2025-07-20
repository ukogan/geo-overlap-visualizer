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
        
        // Build Overpass query for the city
        let overpassQuery = '';
        
        if (city.relationId) {
          // If we have a specific relation ID, use it directly
          overpassQuery = `
            [out:json][timeout:60];
            rel(${city.relationId});
            out geom;
          `;
        } else {
          // For US metropolitan areas, try multiple search strategies
          if (city.name === "New York") {
            // Try specific relation ID for NYC metro area
            overpassQuery = `
              [out:json][timeout:60];
              (
                rel["name"~"New York",i]["type"="boundary"]["boundary"="administrative"]["admin_level"~"[4-6]"];
                rel["name"~"New York Metropolitan",i]["type"="boundary"];
                rel["name"~"Greater New York",i]["type"="boundary"];
                rel["name"~"New York City",i]["type"="boundary"]["boundary"="administrative"];
                rel(175905);
              );
              out geom;
            `;
          } else if (city.name === "Chicago") {
            // Try specific approaches for Chicago metro area
            overpassQuery = `
              [out:json][timeout:60];
              (
                rel["name"~"Chicago",i]["type"="boundary"]["boundary"="administrative"]["admin_level"~"[4-6]"];
                rel["name"~"Chicago Metropolitan",i]["type"="boundary"];
                rel["name"~"Greater Chicago",i]["type"="boundary"];
                rel["name"~"Chicagoland",i]["type"="boundary"];
                rel(122604);
              );
              out geom;
            `;
          } else {
            // Generic search for other cities
            const searchName = city.name.toLowerCase();
            const countryFilter = city.country ? `["ISO3166-1"="${city.country}"]` : '';
            const adminLevelFilter = city.adminLevel ? `["admin_level"="${city.adminLevel}"]` : '';
            
            overpassQuery = `
              [out:json][timeout:60];
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
          continue;
        }

        const overpassData = await overpassResponse.json();
        console.log(`Found ${overpassData.elements?.length || 0} elements for ${city.name}`);

        if (!overpassData.elements || overpassData.elements.length === 0) {
          console.log(`No boundary data found for ${city.name}`);
          continue;
        }

        // Find the best matching relation (usually the largest or most detailed one)
        const relations = overpassData.elements.filter((el: any) => el.type === 'relation');
        if (relations.length === 0) {
          console.log(`No relations found for ${city.name}`);
          continue;
        }

        // Sort by number of members (more detailed boundaries have more members)
        relations.sort((a: any, b: any) => (b.members?.length || 0) - (a.members?.length || 0));
        const bestRelation = relations[0];

        console.log(`Selected relation ${bestRelation.id} for ${city.name} with ${bestRelation.members?.length || 0} members`);

        // Convert OSM relation to GeoJSON
        const coordinates = [];
        
        if (bestRelation.members) {
          for (const member of bestRelation.members) {
            if (member.type === 'way' && (member.role === 'outer' || member.role === '' || !member.role)) {
              const way = overpassData.elements.find((el: any) => el.type === 'way' && el.id === member.ref);
              if (way && way.geometry && way.geometry.length > 0) {
                const wayCoords = way.geometry.map((node: any) => [node.lon, node.lat]);
                if (wayCoords.length > 2) { // Only include ways with at least 3 points
                  coordinates.push(wayCoords);
                }
              }
            }
          }
        }

        console.log(`Extracted ${coordinates.length} coordinate rings for ${city.name}`);

        if (coordinates.length === 0) {
          console.log(`No valid coordinates found for ${city.name}`);
          continue;
        }

        // Create GeoJSON
        const geoJson = {
          type: "MultiPolygon",
          coordinates: [coordinates]
        };

        // Calculate center and bounding box
        const allCoords = coordinates.flat();
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

        // Calculate approximate area (rough estimation)
        const areaKm2 = Math.abs((maxLng - minLng) * (maxLat - minLat)) * 111 * 111; // Very rough approximation

        // Update or insert boundary data
        const { error: upsertError } = await supabase
          .from('boundaries')
          .upsert({
            name: city.name,
            geometry: `SRID=4326;${JSON.stringify(geoJson)}`,
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
          continue;
        }

        results.push({
          name: city.name,
          success: true,
          coordinateCount: allCoords.length,
          relationId: bestRelation.id,
          areaKm2: areaKm2
        });

        console.log(`Successfully processed ${city.name} with ${allCoords.length} coordinate points`);

      } catch (error) {
        console.error(`Error processing ${city.name}:`, error);
        results.push({
          name: city.name,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Processed ${results.length} cities` 
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