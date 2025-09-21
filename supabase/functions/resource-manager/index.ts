import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    if (action === 'get_resources') {
      // Get all resources with their mappings
      const { data: resources, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_category_mappings(
            resource_categories(name)
          ),
          resource_phase_mappings(
            learning_phases(name, order_index)
          ),
          resource_domain_mappings(
            learning_domains(name, is_foundational)
          )
        `)
        .order('quality_score', { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ resources }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_categories') {
      const { data: categories, error } = await supabase
        .from('resource_categories')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ categories }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_domains') {
      const { data: domains, error } = await supabase
        .from('learning_domains')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ domains }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_phases') {
      const { data: phases, error } = await supabase
        .from('learning_phases')
        .select('*')
        .order('order_index');

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ phases }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resource-manager function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});