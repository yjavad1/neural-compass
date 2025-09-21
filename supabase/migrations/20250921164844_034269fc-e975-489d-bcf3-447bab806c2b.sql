-- Create resource mappings for AI Ethics resources
DO $$
DECLARE
    ethics_domain_id uuid;
    foundations_phase_id uuid;
    specialization_phase_id uuid;
    practical_phase_id uuid;
    advanced_phase_id uuid;
    resource_record RECORD;
BEGIN
    -- Get domain and phase IDs
    SELECT id INTO ethics_domain_id FROM learning_domains WHERE name = 'AI Ethics & Philosophy';
    SELECT id INTO foundations_phase_id FROM learning_phases WHERE name = 'Foundations & Core';
    SELECT id INTO specialization_phase_id FROM learning_phases WHERE name = 'Specialization Deep-Dive';
    SELECT id INTO practical_phase_id FROM learning_phases WHERE name = 'Practical Application';
    SELECT id INTO advanced_phase_id FROM learning_phases WHERE name = 'Advanced & Research';
    
    -- Map ethics resources to domain and phases
    FOR resource_record IN 
        SELECT id, title, difficulty_level FROM resources 
        WHERE title IN ('Ethics in AI Design (edX)', 'AI Ethics for Everyone (Coursera)', 
                       'Philosophy of AI (Stanford)', 'Responsible AI Practices (Google)',
                       'AI Alignment Problem (Book)', 'Ethics of Artificial Intelligence (MIT)',
                       'AI Fairness 360 Toolkit', 'Ethics in AI Research (arXiv)')
    LOOP
        -- Map to AI Ethics domain
        INSERT INTO resource_domain_mappings (resource_id, domain_id, relevance_score)
        VALUES (resource_record.id, ethics_domain_id, 95);
        
        -- Map to appropriate phases based on difficulty and type
        IF resource_record.difficulty_level = 'beginner' THEN
            INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
            VALUES (resource_record.id, foundations_phase_id, 90);
        ELSIF resource_record.difficulty_level = 'intermediate' AND resource_record.title LIKE '%Philosophy%' THEN
            INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
            VALUES (resource_record.id, specialization_phase_id, 95);
        ELSIF resource_record.difficulty_level = 'intermediate' AND resource_record.title LIKE '%Toolkit%' THEN
            INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
            VALUES (resource_record.id, practical_phase_id, 90);
        ELSIF resource_record.title LIKE '%Responsible AI Practices%' THEN
            INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
            VALUES (resource_record.id, specialization_phase_id, 85);
        ELSIF resource_record.difficulty_level = 'advanced' THEN
            INSERT INTO resource_phase_mappings (resource_id, phase_id, relevance_score)
            VALUES (resource_record.id, advanced_phase_id, 95);
        END IF;
    END LOOP;
END $$;