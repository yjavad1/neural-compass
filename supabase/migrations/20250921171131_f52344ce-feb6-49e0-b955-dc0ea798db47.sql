-- Map new resources to appropriate domains and learning phases

-- First, get the domain and phase IDs we need
WITH domain_ids AS (
  SELECT 
    id as healthcare_id, 'Healthcare AI' as name FROM learning_domains WHERE name = 'Healthcare AI'
  UNION ALL
  SELECT 
    id as finance_id, 'Finance AI' as name FROM learning_domains WHERE name = 'Finance AI'
  UNION ALL  
  SELECT 
    id as marketing_id, 'Marketing AI' as name FROM learning_domains WHERE name = 'Marketing AI'
  UNION ALL
  SELECT 
    id as education_id, 'Education AI' as name FROM learning_domains WHERE name = 'Education AI'
  UNION ALL
  SELECT 
    id as research_id, 'Research AI' as name FROM learning_domains WHERE name = 'Research AI'
  UNION ALL
  SELECT 
    id as core_id, 'Foundations & Core' as name FROM learning_domains WHERE name = 'Foundations & Core'
),
phase_ids AS (
  SELECT 
    id as foundations_id, 'Foundations' as name FROM learning_phases WHERE name = 'Foundations'
  UNION ALL
  SELECT 
    id as specialization_id, 'Specialization Deep-Dive' as name FROM learning_phases WHERE name = 'Specialization Deep-Dive'
  UNION ALL
  SELECT 
    id as practical_id, 'Practical Application' as name FROM learning_phases WHERE name = 'Practical Application'
  UNION ALL
  SELECT 
    id as advanced_id, 'Advanced & Research' as name FROM learning_phases WHERE name = 'Advanced & Research'
)

-- Map Healthcare AI resources
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.healthcare_id, 95
FROM resources r, domain_ids d
WHERE r.title IN ('AI in Healthcare: Complete Guide', 'Medical Image Analysis with Deep Learning')
AND d.name = 'Healthcare AI';

-- Map Finance AI resources  
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.finance_id, 95
FROM resources r, domain_ids d
WHERE r.title IN ('Algorithmic Trading with Machine Learning', 'Risk Management with AI', 'Robo-Advisory Development')
AND d.name = 'Finance AI';

-- Map Marketing AI resources
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.marketing_id, 95
FROM resources r, domain_ids d
WHERE r.title IN ('AI-Powered Marketing Analytics', 'Recommendation Systems for E-commerce')
AND d.name = 'Marketing AI';

-- Map Education AI resources
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.education_id, 95
FROM resources r, domain_ids d
WHERE r.title = 'AI in Education: Adaptive Learning Systems'
AND d.name = 'Education AI';

-- Map Research AI resources
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.research_id, 95
FROM resources r, domain_ids d
WHERE r.title IN ('AI Research Methodology', 'Reproducible AI Research')
AND d.name = 'Research AI';

-- Map general/foundational resources to Core domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, d.core_id, 90
FROM resources r, domain_ids d
WHERE r.title IN ('Advanced Computer Vision Techniques', 'Natural Language Processing Specialization', 
                 'Reinforcement Learning Deep Dive', 'MLOps in Production', 'End-to-End ML Project Workshop',
                 'AI for Social Good', 'Explainable AI Techniques', 'AI Safety and Alignment', 'Building AI Startups')
AND d.name = 'Foundations & Core';

-- Map resources to appropriate learning phases based on difficulty
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, p.foundations_id, 95
FROM resources r, phase_ids p
WHERE r.title IN ('AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics', 
                 'AI in Education: Adaptive Learning Systems', 'AI for Social Good')
AND p.name = 'Foundations'
AND r.difficulty_level = 'beginner';

INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, p.specialization_id, 95
FROM resources r, phase_ids p
WHERE r.title IN ('Medical Image Analysis with Deep Learning', 'Algorithmic Trading with Machine Learning',
                 'Robo-Advisory Development', 'Recommendation Systems for E-commerce',
                 'Natural Language Processing Specialization', 'MLOps in Production',
                 'End-to-End ML Project Workshop', 'Explainable AI Techniques', 'Building AI Startups')
AND p.name = 'Specialization Deep-Dive'
AND r.difficulty_level = 'intermediate';

INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, p.advanced_id, 95
FROM resources r, phase_ids p
WHERE r.title IN ('Risk Management with AI', 'AI Research Methodology', 'Reproducible AI Research',
                 'Advanced Computer Vision Techniques', 'Reinforcement Learning Deep Dive', 'AI Safety and Alignment')
AND p.name = 'Advanced & Research'
AND r.difficulty_level = 'advanced';