-- Remove duplicate resources, keeping only the first occurrence of each unique title+url combination
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY title, url ORDER BY created_at) as rn
  FROM public.resources
)
DELETE FROM public.resources 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Clean up any orphaned mappings (though there shouldn't be any with our current setup)
DELETE FROM public.resource_category_mappings 
WHERE resource_id NOT IN (SELECT id FROM public.resources);

DELETE FROM public.resource_phase_mappings 
WHERE resource_id NOT IN (SELECT id FROM public.resources);

DELETE FROM public.resource_domain_mappings 
WHERE resource_id NOT IN (SELECT id FROM public.resources);