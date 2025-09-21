-- Map new resources to appropriate domains and learning phases

-- Map Healthcare AI resources to Healthcare AI domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN ('AI in Healthcare: Complete Guide', 'Medical Image Analysis with Deep Learning')
AND ld.name = 'Healthcare AI';

-- Map Finance AI resources to Finance AI domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN ('Algorithmic Trading with Machine Learning', 'Risk Management with AI', 'Robo-Advisory Development')
AND ld.name = 'Finance AI';

-- Map Marketing AI resources to Marketing AI domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN ('AI-Powered Marketing Analytics', 'Recommendation Systems for E-commerce')
AND ld.name = 'Marketing AI';

-- Map Education AI resources to Education AI domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title = 'AI in Education: Adaptive Learning Systems'
AND ld.name = 'Education AI';

-- Map Research AI resources to Research AI domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 95
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN ('AI Research Methodology', 'Reproducible AI Research')
AND ld.name = 'Research AI';

-- Map general/foundational resources to Core domain
INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
SELECT r.id, ld.id, 90
FROM resources r
CROSS JOIN learning_domains ld
WHERE r.title IN ('Advanced Computer Vision Techniques', 'Natural Language Processing Specialization', 
                 'Reinforcement Learning Deep Dive', 'MLOps in Production', 'End-to-End ML Project Workshop',
                 'AI for Social Good', 'Explainable AI Techniques', 'AI Safety and Alignment', 'Building AI Startups')
AND ld.name = 'Foundations & Core';

-- Map beginner resources to Foundations phase
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.title IN ('AI in Healthcare: Complete Guide', 'AI-Powered Marketing Analytics', 
                 'AI in Education: Adaptive Learning Systems', 'AI for Social Good')
AND lp.name = 'Foundations'
AND r.difficulty_level = 'beginner';

-- Map intermediate resources to Specialization phase
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.title IN ('Medical Image Analysis with Deep Learning', 'Algorithmic Trading with Machine Learning',
                 'Robo-Advisory Development', 'Recommendation Systems for E-commerce',
                 'Natural Language Processing Specialization', 'MLOps in Production',
                 'End-to-End ML Project Workshop', 'Explainable AI Techniques', 'Building AI Startups')
AND lp.name = 'Specialization Deep-Dive'
AND r.difficulty_level = 'intermediate';

-- Map advanced resources to Advanced & Research phase
INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
SELECT r.id, lp.id, 95
FROM resources r
CROSS JOIN learning_phases lp
WHERE r.title IN ('Risk Management with AI', 'AI Research Methodology', 'Reproducible AI Research',
                 'Advanced Computer Vision Techniques', 'Reinforcement Learning Deep Dive', 'AI Safety and Alignment')
AND lp.name = 'Advanced & Research'
AND r.difficulty_level = 'advanced';