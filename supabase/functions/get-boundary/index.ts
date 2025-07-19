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
        ST_AsGeoJSON(geometry) as geometry_json,
        ST_AsGeoJSON(bbox) as bbox_json,
        ST_X(ST_Centroid(geometry)) as center_lng,
        ST_Y(ST_Centroid(geometry)) as center_lat
      `)

    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.eq('name', name)
    }

    const { data: boundaries, error } = await query.single()

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
        name: boundaries.name_long || boundaries.name,
        admin_level: boundaries.admin_level,
        country_code: boundaries.country_code,
        area: boundaries.area_km2,
        population: boundaries.population,
        center: [boundaries.center_lng, boundaries.center_lat]
      },
      geometry: boundaries.geometry_json ? JSON.parse(boundaries.geometry_json) : null
    }

    const bbox = boundaries.bbox_json ? JSON.parse(boundaries.bbox_json) : null
    const center = [boundaries.center_lng, boundaries.center_lat]

    return new Response(
      JSON.stringify({
        boundary: feature,
        center,
        bbox: bbox?.coordinates?.[0] ? [
          Math.min(...bbox.coordinates[0].map((c: number[]) => c[0])),
          Math.min(...bbox.coordinates[0].map((c: number[]) => c[1])),
          Math.max(...bbox.coordinates[0].map((c: number[]) => c[0])),
          Math.max(...bbox.coordinates[0].map((c: number[]) => c[1]))
        ] : null
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