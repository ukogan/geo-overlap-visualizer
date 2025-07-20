
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { id, name } = await req.json()
    
    console.log('Getting boundary for:', { id, name })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let boundary = null

    // First try to get by ID if provided
    if (id) {
      console.log('Searching by ID:', id)
      const { data, error } = await supabaseClient
        .from('boundaries')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        boundary = data
        console.log('Found boundary by ID')
      } else {
        console.log('No boundary found by ID, error:', error)
      }
    }

    // If no boundary found by ID, try searching by name
    if (!boundary && name) {
      console.log('Searching by name:', name)
      
      // Extract just the city name (first part before comma)
      const cityName = name.split(',')[0].trim()
      console.log('Extracted city name:', cityName)
      
      // Try exact match first
      let { data, error } = await supabaseClient
        .from('boundaries')
        .select('*')
        .eq('name', cityName)
        .single()

      if (!error && data) {
        boundary = data
        console.log('Found boundary by exact name match')
      } else {
        console.log('No exact match, trying case-insensitive search')
        
        // Try case-insensitive search
        const result = await supabaseClient
          .from('boundaries')
          .select('*')
          .ilike('name', `%${cityName}%`)
          .limit(1)

        if (!result.error && result.data && result.data.length > 0) {
          boundary = result.data[0]
          console.log('Found boundary by case-insensitive search')
        } else {
          console.log('No boundary found by name search, error:', result.error)
        }
      }
    }

    // Also check city_boundaries table if no boundary found
    if (!boundary && name) {
      console.log('Checking city_boundaries table')
      const cityName = name.split(',')[0].trim()
      
      const { data, error } = await supabaseClient
        .from('city_boundaries')
        .select('*')
        .ilike('name', `%${cityName}%`)
        .limit(1)

      if (!error && data && data.length > 0) {
        const cityBoundary = data[0]
        console.log('Found in city_boundaries table:', cityBoundary.name)
        
        // Transform city_boundaries data to expected format
        if (cityBoundary.boundary_data) {
          return new Response(
            JSON.stringify({
              boundary: cityBoundary.boundary_data.boundary,
              center: cityBoundary.boundary_data.center || [cityBoundary.center_lng, cityBoundary.center_lat],
              bbox: cityBoundary.boundary_data.bbox || cityBoundary.bbox,
              areaKm2: cityBoundary.area_km2,
              population: cityBoundary.population
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        console.log('Not found in city_boundaries, error:', error)
      }
    }

    if (!boundary) {
      console.log('No boundary found anywhere')
      return new Response(
        JSON.stringify({ error: 'Boundary not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Transform boundary data to expected format
    const result = {
      boundary: {
        type: "Feature",
        geometry: boundary.geometry_geojson,
        properties: {
          name: boundary.name,
          area: boundary.area_km2,
          center: [boundary.center_lng, boundary.center_lat]
        }
      },
      center: [boundary.center_lng, boundary.center_lat],
      bbox: boundary.bbox_geojson ? [
        boundary.bbox_geojson.coordinates[0][0][0], // minLng
        boundary.bbox_geojson.coordinates[0][0][1], // minLat
        boundary.bbox_geojson.coordinates[0][2][0], // maxLng
        boundary.bbox_geojson.coordinates[0][2][1]  // maxLat
      ] : null,
      areaKm2: boundary.area_km2,
      population: boundary.population
    }

    console.log('Returning boundary data for:', boundary.name)
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
