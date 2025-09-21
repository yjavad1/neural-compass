-- Comprehensive Resource System Cleanup and Optimization

-- Step 1: Remove duplicate resources (keep only the first occurrence of each title)
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT id, title, 
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) as rn
    FROM resources
  ) ranked
  WHERE rn > 1
),
orphaned_domain_mappings AS (
  SELECT rdm.id
  FROM resource_domain_mappings rdm
  JOIN duplicates_to_delete dtd ON rdm.resource_id = dtd.id
),
orphaned_phase_mappings AS (
  SELECT rpm.id  
  FROM resource_phase_mappings rpm
  JOIN duplicates_to_delete dtd ON rpm.resource_id = dtd.id
),
orphaned_category_mappings AS (
  SELECT rcm.id
  FROM resource_category_mappings rcm
  JOIN duplicates_to_delete dtd ON rcm.resource_id = dtd.id
)
-- Delete orphaned mappings first
DELETE FROM resource_domain_mappings WHERE id IN (SELECT id FROM orphaned_domain_mappings);

WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT id, title, 
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) as rn
    FROM resources
  ) ranked
  WHERE rn > 1
),
orphaned_phase_mappings AS (
  SELECT rpm.id  
  FROM resource_phase_mappings rpm
  JOIN duplicates_to_delete dtd ON rpm.resource_id = dtd.id
)
DELETE FROM resource_phase_mappings WHERE id IN (SELECT id FROM orphaned_phase_mappings);

WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT id, title, 
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) as rn
    FROM resources
  ) ranked
  WHERE rn > 1
),
orphaned_category_mappings AS (
  SELECT rcm.id
  FROM resource_category_mappings rcm
  JOIN duplicates_to_delete dtd ON rcm.resource_id = dtd.id
)
DELETE FROM resource_category_mappings WHERE id IN (SELECT id FROM orphaned_category_mappings);

-- Now delete duplicate resources
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT id, title, 
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) as rn
    FROM resources
  ) ranked
  WHERE rn > 1
)
DELETE FROM resources WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Step 2: Map all unmapped resources to appropriate domains

-- Healthcare AI domain mappings
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'AI in Healthcare: Complete Guide',
  'Medical Image Analysis with Deep Learning', 
  'FDA Guidelines for AI in Medical Devices'
) AND ld.name = 'Healthcare AI'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Finance AI domain mappings  
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'Algorithmic Trading with Machine Learning',
  'Risk Management with AI',
  'Robo-Advisory Development'
) AND ld.name = 'Finance AI'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Marketing AI domain mappings
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'AI-Powered Marketing Analytics',
  'Recommendation Systems for E-commerce'
) AND ld.name = 'Marketing AI'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Education AI domain mappings
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'AI in Education: Adaptive Learning Systems',
  'Automated Essay Scoring with NLP'
) AND ld.name = 'Education AI'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Research & Academia domain mappings (fix the empty domain)
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'AI Research Methodology',
  'Reproducible AI Research',
  'Real-time AI Applications'
) AND ld.name = 'Research & Academia'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Core AI Learning domain mappings
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 90
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'Advanced Computer Vision Techniques',
  'Natural Language Processing Specialization',
  'Reinforcement Learning Deep Dive',
  'MLOps in Production',
  'End-to-End ML Project Workshop',
  'Conversational AI for Customer Service',
  'AI Product Management'
) AND ld.name = 'Core AI Learning'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- AI Ethics & Philosophy domain mappings
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 90
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN (
  'AI for Social Good',
  'Explainable AI Techniques', 
  'AI Safety and Alignment',
  'Building AI Startups'
) AND ld.name = 'AI Ethics & Philosophy'
AND NOT EXISTS (SELECT 1 FROM resource_domain_mappings WHERE resource_id = r.id AND domain_id = ld.id);

-- Step 3: Map all resources to appropriate learning phases

-- Foundations phase mappings
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.difficulty_level = 'beginner' 
AND lp.name = 'Foundations'
AND NOT EXISTS (SELECT 1 FROM resource_phase_mappings WHERE resource_id = r.id AND phase_id = lp.id);

-- Specialization Deep-Dive phase mappings
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.difficulty_level = 'intermediate'
AND lp.name = 'Specialization Deep-Dive'
AND NOT EXISTS (SELECT 1 FROM resource_phase_mappings WHERE resource_id = r.id AND phase_id = lp.id);

-- Advanced & Research phase mappings
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.difficulty_level = 'advanced'
AND lp.name = 'Advanced & Research'
AND NOT EXISTS (SELECT 1 FROM resource_phase_mappings WHERE resource_id = r.id AND phase_id = lp.id);