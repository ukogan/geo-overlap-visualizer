import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to determine admin level from OSM data
function getAdminLevel(type: string, osmClass: string): number {
  if (type === 'city' || type === 'town' || type === 'village') return 8
  if (type === 'county') return 6
  if (type === 'state') return 4
  if (osmClass === 'boundary' && type === 'administrative') return 8
  return 8 // Default to city level
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Search local database first - escape query for SQL safety
    const escapedQuery = query.replace(/'/g, "''"); // Escape single quotes
    const { data: boundaries, error } = await supabaseClient
      .from('boundaries')
      .select(`
        id,
        name,
        name_long,
        admin_level,
        country_code,
        area_km2,
        population,
        geometry_geojson,
        bbox_geojson
      `)
      .or(`name.ilike.%${escapedQuery}%,name_long.ilike.%${escapedQuery}%`)
      .order('admin_level', { ascending: true })
      .order('population', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Database error:', error)
    }

    // Transform local results to match expected format
    const localResults = boundaries?.map(boundary => ({
      id: boundary.id,
      place_name: boundary.name_long || boundary.name,
      name: boundary.name,
      admin_level: boundary.admin_level,
      country_code: boundary.country_code,
      area_km2: boundary.area_km2,
      population: boundary.population,
      geometry: boundary.geometry_geojson,
      bbox: boundary.bbox_geojson,
      source: 'local'
    })) || []

    // Search external sources for additional results
    let externalResults = []
    try {
      // Use Nominatim to search for US locations
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=10&q=${encodeURIComponent(query + ' USA')}`
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'GeoCompare/1.0'
        }
      })
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json()
        
        externalResults = nominatimData
          .filter((item: any) => {
            // Filter for relevant administrative levels
            const adminLevel = parseInt(item.importance * 20) // Rough conversion
            return item.class === 'place' || item.class === 'boundary' || 
                   (item.class === 'admin' && ['city', 'county', 'state'].includes(item.type))
          })
          .slice(0, 5)
          .map((item: any) => ({
            id: null, // No local ID
            place_name: item.display_name,
            name: item.name,
            admin_level: getAdminLevel(item.type, item.class),
            country_code: 'US',
            area_km2: null,
            population: null,
            geometry: null,
            bbox: item.boundingbox ? {
              type: 'Polygon',
              coordinates: [[
                [parseFloat(item.boundingbox[2]), parseFloat(item.boundingbox[0])],
                [parseFloat(item.boundingbox[3]), parseFloat(item.boundingbox[0])],
                [parseFloat(item.boundingbox[3]), parseFloat(item.boundingbox[1])],
                [parseFloat(item.boundingbox[2]), parseFloat(item.boundingbox[1])],
                [parseFloat(item.boundingbox[2]), parseFloat(item.boundingbox[0])]
              ]]
            } : null,
            center: [parseFloat(item.lon), parseFloat(item.lat)],
            osm_id: item.osm_id,
            osm_type: item.osm_type,
            source: 'external'
          }))
      }
    } catch (nominatimError) {
      console.error('Nominatim search error:', nominatimError)
    }

    // Combine and deduplicate results (prioritize local)
    const allResults = [...localResults, ...externalResults]
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.name.toLowerCase() === result.name.toLowerCase())
    ).slice(0, 10)

    return new Response(
      JSON.stringify({ features: uniqueResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})