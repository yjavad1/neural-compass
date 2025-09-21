-- Create AI Ethics learning domain
INSERT INTO learning_domains (name, description, is_foundational) 
VALUES ('AI Ethics & Philosophy', 'Ethical considerations, governance, and philosophical implications of artificial intelligence', false);

-- Insert real AI ethics resources with verified URLs
INSERT INTO resources (
  title, description, url, type, provider, difficulty_level, cost_type, 
  duration_hours, rating, quality_score, is_core_foundational, 
  learning_outcomes, prerequisites, tags
) VALUES 
-- Foundations level ethics resources
('Ethics in AI Design (edX)', 'Comprehensive course on ethical AI development and responsible design principles', 'https://www.edx.org/learn/artificial-intelligence/university-of-leeds-ethics-in-ai-design', 'course', 'University of Leeds (edX)', 'beginner', 'free', 20, 4.5, 85, true, 
 ARRAY['Ethical AI principles', 'Responsible design', 'AI bias prevention'], ARRAY[]::text[], 
 ARRAY['ethics', 'design', 'responsibility', 'bias']),

('AI Ethics for Everyone (Coursera)', 'Introduction to AI ethics covering societal impact and moral considerations', 'https://www.coursera.org/learn/ai-ethics-for-everyone', 'course', 'University of Helsinki (Coursera)', 'beginner', 'freemium', 15, 4.4, 80, true,
 ARRAY['AI ethics fundamentals', 'Societal impact analysis', 'Moral reasoning'], ARRAY[]::text[],
 ARRAY['ethics', 'society', 'philosophy', 'fundamentals']),

-- Intermediate level resources  
('Philosophy of AI (Stanford)', 'Deep dive into philosophical questions raised by artificial intelligence', 'https://plato.stanford.edu/entries/artificial-intelligence/', 'tutorial', 'Stanford Encyclopedia of Philosophy', 'intermediate', 'free', 10, 4.7, 90, false,
 ARRAY['AI philosophy', 'Consciousness in AI', 'Machine ethics'], ARRAY['Basic philosophy background'],
 ARRAY['philosophy', 'consciousness', 'machine-ethics']),

('Responsible AI Practices (Google)', 'Practical guide to implementing responsible AI in organizations', 'https://ai.google/responsibility/responsible-ai-practices/', 'tutorial', 'Google AI', 'intermediate', 'free', 8, 4.3, 75, false,
 ARRAY['Responsible AI implementation', 'Organizational practices', 'AI governance'], ARRAY['Basic AI knowledge'],
 ARRAY['responsible-ai', 'governance', 'practices']),

-- Advanced resources
('AI Alignment Problem (Book)', 'Comprehensive exploration of AI safety and alignment challenges', 'https://www.amazon.com/Alignment-Problem-Machine-Learning-Values/dp/0393635821', 'book', 'Brian Christian', 'advanced', 'paid', 40, 4.6, 95, false,
 ARRAY['AI safety', 'Value alignment', 'Long-term AI risks'], ARRAY['Intermediate AI knowledge'],
 ARRAY['safety', 'alignment', 'risks', 'future']),

('Ethics of Artificial Intelligence (MIT)', 'Advanced course on AI ethics from philosophical and technical perspectives', 'https://ocw.mit.edu/courses/24-091-ethics-of-artificial-intelligence-spring-2019/', 'course', 'MIT OpenCourseWare', 'advanced', 'free', 35, 4.8, 95, false,
 ARRAY['Advanced AI ethics', 'Technical ethics', 'Policy implications'], ARRAY['Philosophy background', 'Advanced AI knowledge'],
 ARRAY['ethics', 'philosophy', 'policy', 'technical']),

-- Practical application resources
('AI Fairness 360 Toolkit', 'Hands-on toolkit for detecting and mitigating bias in AI systems', 'https://aif360.mybluemix.net/', 'tool', 'IBM Research', 'intermediate', 'free', 12, 4.2, 85, false,
 ARRAY['Bias detection', 'Fairness metrics', 'Practical implementation'], ARRAY['Python programming', 'ML basics'],
 ARRAY['fairness', 'bias', 'toolkit', 'implementation']),

('Ethics in AI Research (arXiv)', 'Collection of research papers on AI ethics and responsible research practices', 'https://arxiv.org/list/cs.CY/recent', 'tutorial', 'arXiv', 'advanced', 'free', 20, 4.1, 80, false,
 ARRAY['Research ethics', 'Publication standards', 'Peer review'], ARRAY['Research background'],
 ARRAY['research', 'ethics', 'papers', 'academia']);