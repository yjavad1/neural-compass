-- Map new resources to domains and learning phases

-- Get the domain and phase IDs first, then map the new resources
WITH new_resources AS (
  SELECT id, title, tags FROM public.resources 
  WHERE title IN (
    'AI in Healthcare: Complete Guide', 'Medical Image Analysis with Deep Learning', 'FDA Guidelines for AI in Medical Devices',
    'Algorithmic Trading with Machine Learning', 'Risk Management with AI', 'Robo-Advisory Development',
    'AI-Powered Marketing Analytics', 'Conversational AI for Customer Service', 'Recommendation Systems for E-commerce',
    'AI in Education: Adaptive Learning Systems', 'Automated Essay Scoring with NLP',
    'AI Research Methodology', 'Reproducible AI Research',
    'Advanced Computer Vision Techniques', 'Natural Language Processing Specialization', 'Reinforcement Learning Deep Dive',
    'MLOps in Production', 'Real-time AI Applications', 'AI Product Management', 'End-to-End ML Project Workshop',
    'AI for Social Good', 'Explainable AI Techniques', 'AI Safety and Alignment', 'Building AI Startups'
  )
),
domains AS (
  SELECT id, name FROM public.learning_domains
),
phases AS (
  SELECT id, name, order_index FROM public.learning_phases ORDER BY order_index
)

-- Insert domain mappings
INSERT INTO public.resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT 
  r.id,
  d.id,
  CASE 
    -- Healthcare AI domain mappings
    WHEN r.title LIKE '%Healthcare%' OR r.title LIKE '%Medical%' OR r.title LIKE '%FDA%' THEN
      CASE WHEN d.name = 'Healthcare AI' THEN 100 ELSE 50 END
    -- Finance AI domain mappings  
    WHEN r.title LIKE '%Trading%' OR r.title LIKE '%Risk Management%' OR r.title LIKE '%Robo-Advisory%' THEN
      CASE WHEN d.name = 'Finance AI' THEN 100 ELSE 50 END
    -- Marketing AI domain mappings
    WHEN r.title LIKE '%Marketing%' OR r.title LIKE '%Conversational%' OR r.title LIKE '%Recommendation%' THEN
      CASE WHEN d.name = 'Marketing AI' THEN 100 ELSE 50 END
    -- Education AI domain mappings
    WHEN r.title LIKE '%Education%' OR r.title LIKE '%Essay Scoring%' THEN
      CASE WHEN d.name = 'Education AI' THEN 100 ELSE 50 END
    -- Research AI domain mappings
    WHEN r.title LIKE '%Research%' THEN
      CASE WHEN d.name = 'Research AI' THEN 100 ELSE 50 END
    -- Computer Vision domain mappings
    WHEN r.title LIKE '%Computer Vision%' OR 'computer-vision' = ANY(r.tags) THEN
      CASE WHEN d.name = 'Computer Vision' THEN 100 ELSE 70 END
    -- NLP domain mappings
    WHEN r.title LIKE '%NLP%' OR r.title LIKE '%Language%' OR 'nlp' = ANY(r.tags) THEN
      CASE WHEN d.name = 'Natural Language Processing' THEN 100 ELSE 70 END
    -- ML Operations domain mappings
    WHEN r.title LIKE '%MLOps%' OR r.title LIKE '%Production%' THEN
      CASE WHEN d.name = 'Machine Learning Operations' THEN 100 ELSE 70 END
    -- Ethics domain mappings
    WHEN r.title LIKE '%Ethics%' OR r.title LIKE '%Safety%' OR r.title LIKE '%Social Good%' THEN
      CASE WHEN d.name = 'AI Ethics & Philosophy' THEN 100 ELSE 70 END
    -- General AI/ML for broader concepts
    ELSE 
      CASE WHEN d.name IN ('General AI/ML', 'Foundations & Core') THEN 80 ELSE 60 END
  END as relevance_score
FROM new_resources r
CROSS JOIN domains d
WHERE (
  -- Healthcare AI mappings
  (r.title LIKE '%Healthcare%' OR r.title LIKE '%Medical%' OR r.title LIKE '%FDA%') AND d.name = 'Healthcare AI'
  OR (r.title LIKE '%Trading%' OR r.title LIKE '%Risk Management%' OR r.title LIKE '%Robo-Advisory%') AND d.name = 'Finance AI'
  OR (r.title LIKE '%Marketing%' OR r.title LIKE '%Conversational%' OR r.title LIKE '%Recommendation%') AND d.name = 'Marketing AI'
  OR (r.title LIKE '%Education%' OR r.title LIKE '%Essay Scoring%') AND d.name = 'Education AI'
  OR r.title LIKE '%Research%' AND d.name = 'Research AI'
  OR (r.title LIKE '%Computer Vision%' OR 'computer-vision' = ANY(r.tags)) AND d.name = 'Computer Vision'
  OR (r.title LIKE '%NLP%' OR r.title LIKE '%Language%' OR 'nlp' = ANY(r.tags)) AND d.name = 'Natural Language Processing'
  OR r.title LIKE '%MLOps%' AND d.name = 'Machine Learning Operations'
  OR (r.title LIKE '%Ethics%' OR r.title LIKE '%Safety%' OR r.title LIKE '%Social Good%') AND d.name = 'AI Ethics & Philosophy'
  OR r.title IN ('Reinforcement Learning Deep Dive', 'Real-time AI Applications', 'AI Product Management', 'End-to-End ML Project Workshop', 'Explainable AI Techniques', 'Building AI Startups') AND d.name = 'General AI/ML'
);

-- Insert phase mappings
INSERT INTO public.resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT 
  r.id,
  p.id,
  CASE 
    -- Foundations phase (beginners)
    WHEN r.title IN (
      'AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics', 
      'AI in Education: Adaptive Learning Systems', 'AI for Social Good'
    ) AND p.name = 'Foundations & Core' THEN 100
    
    -- Specialization phase (intermediate to advanced domain-specific)
    WHEN r.title IN (
      'Medical Image Analysis with Deep Learning', 'Algorithmic Trading with Machine Learning', 
      'Risk Management with AI', 'Conversational AI for Customer Service', 'Recommendation Systems for E-commerce',
      'Advanced Computer Vision Techniques', 'Natural Language Processing Specialization', 
      'Reinforcement Learning Deep Dive', 'Explainable AI Techniques'
    ) AND p.name = 'Specialization Deep-Dive' THEN 100
    
    -- Practical Application phase (hands-on projects and implementation)
    WHEN r.title IN (
      'Robo-Advisory Development', 'Automated Essay Scoring with NLP', 'MLOps in Production',
      'Real-time AI Applications', 'AI Product Management', 'End-to-End ML Project Workshop',
      'Building AI Startups'
    ) AND p.name = 'Practical Application' THEN 100
    
    -- Advanced Research phase (research and cutting-edge topics)
    WHEN r.title IN (
      'FDA Guidelines for AI in Medical Devices', 'AI Research Methodology', 
      'Reproducible AI Research', 'AI Safety and Alignment'
    ) AND p.name = 'Advanced & Research' THEN 100
    
    -- Secondary mappings (lower relevance scores)
    WHEN r.title IN (
      'Medical Image Analysis with Deep Learning', 'Risk Management with AI', 
      'Advanced Computer Vision Techniques', 'Reinforcement Learning Deep Dive'
    ) AND p.name = 'Advanced & Research' THEN 70
    
    WHEN r.title IN (
      'AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics'
    ) AND p.name = 'Specialization Deep-Dive' THEN 60
    
    ELSE 50
  END as relevance_score
FROM new_resources r
CROSS JOIN phases p
WHERE (
  -- Foundations mappings
  r.title IN ('AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics', 'AI in Education: Adaptive Learning Systems', 'AI for Social Good') AND p.name = 'Foundations & Core'
  
  -- Specialization mappings
  OR r.title IN ('Medical Image Analysis with Deep Learning', 'Algorithmic Trading with Machine Learning', 'Risk Management with AI', 'Conversational AI for Customer Service', 'Recommendation Systems for E-commerce', 'Advanced Computer Vision Techniques', 'Natural Language Processing Specialization', 'Reinforcement Learning Deep Dive', 'Explainable AI Techniques') AND p.name = 'Specialization Deep-Dive'
  
  -- Practical Application mappings
  OR r.title IN ('Robo-Advisory Development', 'Automated Essay Scoring with NLP', 'MLOps in Production', 'Real-time AI Applications', 'AI Product Management', 'End-to-End ML Project Workshop', 'Building AI Startups') AND p.name = 'Practical Application'
  
  -- Advanced Research mappings
  OR r.title IN ('FDA Guidelines for AI in Medical Devices', 'AI Research Methodology', 'Reproducible AI Research', 'AI Safety and Alignment') AND p.name = 'Advanced & Research'
  
  -- Secondary mappings
  OR r.title IN ('Medical Image Analysis with Deep Learning', 'Risk Management with AI', 'Advanced Computer Vision Techniques', 'Reinforcement Learning Deep Dive') AND p.name = 'Advanced & Research'
  OR r.title IN ('AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics') AND p.name = 'Specialization Deep-Dive'
);