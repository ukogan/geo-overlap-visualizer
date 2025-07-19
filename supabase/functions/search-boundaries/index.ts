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

    // Search for boundaries matching the query using the new JSONB columns
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
      .or(`name.ilike.%${query}%,name_long.ilike.%${query}%`)
      .order('admin_level', { ascending: true })
      .order('population', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to search boundaries' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Transform results to match expected format
    const results = boundaries?.map(boundary => ({
      id: boundary.id,
      place_name: boundary.name_long || boundary.name,
      name: boundary.name,
      admin_level: boundary.admin_level,
      country_code: boundary.country_code,
      area_km2: boundary.area_km2,
      population: boundary.population,
      geometry: boundary.geometry_geojson,
      bbox: boundary.bbox_geojson
    })) || []

    return new Response(
      JSON.stringify({ features: results }),
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