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
    
    if (!id && !name) {
      return new Response(
        JSON.stringify({ error: 'Either id or name must be provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    let query = supabaseClient
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
        bbox_geojson,
        center_lng,
        center_lat
      `)

    if (id) {
      query = query.eq('id', id)
    } else {
      // Try exact match first, then fallback to name_long, then partial match
      query = query.or(`name.eq.${name},name_long.eq.${name},name.ilike.%${name}%,name_long.ilike.%${name}%`)
    }

    const { data: boundary, error } = await query.single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Boundary not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Transform result to GeoJSON feature format
    const feature = {
      type: "Feature",
      properties: {
        name: boundary.name_long || boundary.name,
        admin_level: boundary.admin_level,
        country_code: boundary.country_code,
        area: boundary.area_km2,
        population: boundary.population,
        center: [boundary.center_lng, boundary.center_lat]
      },
      geometry: boundary.geometry_geojson
    }

    const center = [boundary.center_lng, boundary.center_lat]
    
    // Calculate bbox from geometry if bbox_geojson exists
    let bbox = null
    if (boundary.bbox_geojson && boundary.bbox_geojson.coordinates?.[0]) {
      const coords = boundary.bbox_geojson.coordinates[0]
      bbox = [
        Math.min(...coords.map((c: number[]) => c[0])),
        Math.min(...coords.map((c: number[]) => c[1])),
        Math.max(...coords.map((c: number[]) => c[0])),
        Math.max(...coords.map((c: number[]) => c[1]))
      ]
    }

    return new Response(
      JSON.stringify({
        boundary: feature,
        center,
        bbox
      }),
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