-- Insert Core AI Learning Resources
-- Get category and domain IDs for mappings
DO $$
DECLARE
    prog_cat_id UUID;
    math_cat_id UUID;
    ml_cat_id UUID;
    dl_cat_id UUID;
    nlp_cat_id UUID;
    cv_cat_id UUID;
    data_cat_id UUID;
    ethics_cat_id UUID;
    tools_cat_id UUID;
    core_domain_id UUID;
    foundations_phase_id UUID;
    
    python_course_id UUID;
    ml_course_id UUID;
    dl_course_id UUID;
    ethics_course_id UUID;
    data_course_id UUID;
    nlp_course_id UUID;
    cv_course_id UUID;
    math_course_id UUID;
    tools_course_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO prog_cat_id FROM public.resource_categories WHERE name = 'Programming Fundamentals';
    SELECT id INTO math_cat_id FROM public.resource_categories WHERE name = 'Mathematics & Statistics';
    SELECT id INTO ml_cat_id FROM public.resource_categories WHERE name = 'Machine Learning';
    SELECT id INTO dl_cat_id FROM public.resource_categories WHERE name = 'Deep Learning';
    SELECT id INTO nlp_cat_id FROM public.resource_categories WHERE name = 'Natural Language Processing';
    SELECT id INTO cv_cat_id FROM public.resource_categories WHERE name = 'Computer Vision';
    SELECT id INTO data_cat_id FROM public.resource_categories WHERE name = 'Data Science & Engineering';
    SELECT id INTO ethics_cat_id FROM public.resource_categories WHERE name = 'AI Ethics & Safety';
    SELECT id INTO tools_cat_id FROM public.resource_categories WHERE name = 'Tools & Frameworks';
    
    -- Get domain and phase IDs
    SELECT id INTO core_domain_id FROM public.learning_domains WHERE name = 'Core AI Learning';
    SELECT id INTO foundations_phase_id FROM public.learning_phases WHERE name = 'Foundations & Core';
    
    -- Insert core foundational resources
    
    -- Python Programming
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Python for Everybody Specialization',
        'Complete Python programming course covering basics to data structures',
        'https://www.coursera.org/specializations/python',
        'course',
        'University of Michigan (Coursera)',
        80,
        'beginner',
        'freemium',
        4.8,
        ARRAY[]::TEXT[],
        ARRAY['Python syntax', 'Data structures', 'Web scraping', 'Database programming']::TEXT[],
        ARRAY['python', 'programming', 'fundamentals', 'data-structures']::TEXT[],
        true,
        95
    ) RETURNING id INTO python_course_id;
    
    -- Machine Learning Course
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Machine Learning Course by Andrew Ng',
        'Comprehensive introduction to machine learning algorithms and concepts',
        'https://www.coursera.org/learn/machine-learning',
        'course',
        'Stanford University (Coursera)',
        60,
        'beginner',
        'freemium',
        4.9,
        ARRAY['Basic programming', 'Linear algebra basics']::TEXT[],
        ARRAY['Supervised learning', 'Unsupervised learning', 'Neural networks', 'ML algorithms']::TEXT[],
        ARRAY['machine-learning', 'algorithms', 'supervised-learning', 'neural-networks']::TEXT[],
        true,
        98
    ) RETURNING id INTO ml_course_id;
    
    -- Deep Learning Specialization
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Deep Learning Specialization',
        'Complete deep learning course covering neural networks to sequence models',
        'https://www.coursera.org/specializations/deep-learning',
        'course',
        'DeepLearning.AI (Coursera)',
        120,
        'intermediate',
        'freemium',
        4.8,
        ARRAY['Python programming', 'Basic machine learning']::TEXT[],
        ARRAY['Neural networks', 'CNN', 'RNN', 'Transformers', 'Deep learning frameworks']::TEXT[],
        ARRAY['deep-learning', 'neural-networks', 'cnn', 'rnn', 'transformers']::TEXT[],
        true,
        96
    ) RETURNING id INTO dl_course_id;
    
    -- AI Ethics
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'AI Ethics and Society',
        'Understanding ethical implications and societal impact of AI systems',
        'https://www.edx.org/course/artificial-intelligence-ethics-and-society',
        'course',
        'University of Helsinki (edX)',
        25,
        'beginner',
        'free',
        4.6,
        ARRAY[]::TEXT[],
        ARRAY['Ethical AI principles', 'Bias detection', 'Fairness in AI', 'AI governance']::TEXT[],
        ARRAY['ethics', 'bias', 'fairness', 'ai-governance', 'society']::TEXT[],
        true,
        90
    ) RETURNING id INTO ethics_course_id;
    
    -- Data Science Course
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Data Science with Python',
        'Complete data science workflow from collection to visualization',
        'https://www.datacamp.com/tracks/data-scientist-with-python',
        'course',
        'DataCamp',
        70,
        'beginner',
        'subscription',
        4.7,
        ARRAY['Basic Python']::TEXT[],
        ARRAY['Data manipulation', 'Statistical analysis', 'Data visualization', 'Pandas', 'NumPy']::TEXT[],
        ARRAY['data-science', 'python', 'pandas', 'numpy', 'visualization']::TEXT[],
        true,
        92
    ) RETURNING id INTO data_course_id;
    
    -- NLP Course
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Natural Language Processing Specialization',
        'Complete NLP course covering text processing to modern language models',
        'https://www.coursera.org/specializations/natural-language-processing',
        'course',
        'DeepLearning.AI (Coursera)',
        100,
        'intermediate',
        'freemium',
        4.7,
        ARRAY['Python programming', 'Basic machine learning']::TEXT[],
        ARRAY['Text preprocessing', 'Language models', 'Sentiment analysis', 'Named entity recognition']::TEXT[],
        ARRAY['nlp', 'text-processing', 'language-models', 'transformers']::TEXT[],
        true,
        94
    ) RETURNING id INTO nlp_course_id;
    
    -- Computer Vision Course
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Computer Vision Fundamentals',
        'Introduction to computer vision techniques and deep learning for images',
        'https://www.udacity.com/course/computer-vision-nanodegree--nd891',
        'course',
        'Udacity',
        90,
        'intermediate',
        'paid',
        4.5,
        ARRAY['Python programming', 'Basic machine learning', 'Linear algebra']::TEXT[],
        ARRAY['Image processing', 'CNN', 'Object detection', 'Image classification']::TEXT[],
        ARRAY['computer-vision', 'image-processing', 'cnn', 'object-detection']::TEXT[],
        true,
        88
    ) RETURNING id INTO cv_course_id;
    
    -- Mathematics for ML
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'Mathematics for Machine Learning Specialization',
        'Mathematical foundations: linear algebra, calculus, and statistics for ML',
        'https://www.coursera.org/specializations/mathematics-machine-learning',
        'course',
        'Imperial College London (Coursera)',
        75,
        'intermediate',
        'freemium',
        4.6,
        ARRAY['High school mathematics']::TEXT[],
        ARRAY['Linear algebra', 'Calculus', 'Statistics', 'Probability', 'Mathematical optimization']::TEXT[],
        ARRAY['mathematics', 'linear-algebra', 'calculus', 'statistics', 'optimization']::TEXT[],
        true,
        91
    ) RETURNING id INTO math_course_id;
    
    -- Tools and Frameworks
    INSERT INTO public.resources (title, description, url, type, provider, duration_hours, difficulty_level, cost_type, rating, prerequisites, learning_outcomes, tags, is_core_foundational, quality_score)
    VALUES (
        'TensorFlow Developer Certificate Program',
        'Hands-on training with TensorFlow for machine learning applications',
        'https://www.tensorflow.org/certificate',
        'course',
        'Google (TensorFlow)',
        50,
        'intermediate',
        'free',
        4.4,
        ARRAY['Python programming', 'Basic machine learning']::TEXT[],
        ARRAY['TensorFlow', 'Keras', 'Model deployment', 'Neural network implementation']::TEXT[],
        ARRAY['tensorflow', 'keras', 'framework', 'neural-networks', 'deployment']::TEXT[],
        true,
        87
    ) RETURNING id INTO tools_course_id;
    
    -- Create category mappings
    INSERT INTO public.resource_category_mappings (resource_id, category_id, relevance_score)
    VALUES 
        (python_course_id, prog_cat_id, 100),
        (ml_course_id, ml_cat_id, 100),
        (dl_course_id, dl_cat_id, 100),
        (ethics_course_id, ethics_cat_id, 100),
        (data_course_id, data_cat_id, 100),
        (nlp_course_id, nlp_cat_id, 100),
        (cv_course_id, cv_cat_id, 100),
        (math_course_id, math_cat_id, 100),
        (tools_course_id, tools_cat_id, 100);
    
    -- Create domain mappings (all resources belong to Core AI Learning)
    INSERT INTO public.resource_domain_mappings (resource_id, domain_id, relevance_score)
    VALUES 
        (python_course_id, core_domain_id, 100),
        (ml_course_id, core_domain_id, 100),
        (dl_course_id, core_domain_id, 95),
        (ethics_course_id, core_domain_id, 90),
        (data_course_id, core_domain_id, 95),
        (nlp_course_id, core_domain_id, 90),
        (cv_course_id, core_domain_id, 90),
        (math_course_id, core_domain_id, 95),
        (tools_course_id, core_domain_id, 85);
    
    -- Create phase mappings (all foundational resources go to Foundations & Core phase)
    INSERT INTO public.resource_phase_mappings (resource_id, phase_id, relevance_score)
    VALUES 
        (python_course_id, foundations_phase_id, 100),
        (ml_course_id, foundations_phase_id, 100),
        (dl_course_id, foundations_phase_id, 85),
        (ethics_course_id, foundations_phase_id, 90),
        (data_course_id, foundations_phase_id, 95),
        (nlp_course_id, foundations_phase_id, 75),
        (cv_course_id, foundations_phase_id, 75),
        (math_course_id, foundations_phase_id, 100),
        (tools_course_id, foundations_phase_id, 80);
        
END $$;