-- Create resource catalog tables
CREATE TABLE public.resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.resource_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create main resources table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'tutorial', 'documentation', 'book', 'video', 'article', 'tool', 'practice')),
  provider TEXT NOT NULL,
  duration_hours INTEGER,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('free', 'paid', 'freemium', 'subscription')),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  prerequisites TEXT[],
  learning_outcomes TEXT[],
  tags TEXT[],
  is_core_foundational BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource to category mapping
CREATE TABLE public.resource_category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.resource_categories(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, category_id)
);

-- Create learning phases table
CREATE TABLE public.learning_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource to phase mappings
CREATE TABLE public.resource_phase_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.learning_phases(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, phase_id)
);

-- Create domains table for specialized paths
CREATE TABLE public.learning_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_foundational BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource to domain mappings
CREATE TABLE public.resource_domain_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.learning_domains(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_id, domain_id)
);

-- Enable RLS on all tables
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_phase_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_domain_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Resources are publicly readable" 
ON public.resources FOR SELECT USING (true);

CREATE POLICY "Resource categories are publicly readable" 
ON public.resource_categories FOR SELECT USING (true);

CREATE POLICY "Resource category mappings are publicly readable" 
ON public.resource_category_mappings FOR SELECT USING (true);

CREATE POLICY "Learning phases are publicly readable" 
ON public.learning_phases FOR SELECT USING (true);

CREATE POLICY "Resource phase mappings are publicly readable" 
ON public.resource_phase_mappings FOR SELECT USING (true);

CREATE POLICY "Learning domains are publicly readable" 
ON public.learning_domains FOR SELECT USING (true);

CREATE POLICY "Resource domain mappings are publicly readable" 
ON public.resource_domain_mappings FOR SELECT USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_difficulty ON public.resources(difficulty_level);
CREATE INDEX idx_resources_cost ON public.resources(cost_type);
CREATE INDEX idx_resources_foundational ON public.resources(is_core_foundational);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resource_category_mappings_resource_id ON public.resource_category_mappings(resource_id);
CREATE INDEX idx_resource_phase_mappings_resource_id ON public.resource_phase_mappings(resource_id);
CREATE INDEX idx_resource_domain_mappings_resource_id ON public.resource_domain_mappings(resource_id);

-- Insert initial learning phases
INSERT INTO public.learning_phases (name, description, order_index) VALUES
('Foundations & Core', 'Essential AI and programming fundamentals', 1),
('Specialization Deep-Dive', 'Advanced concepts in chosen AI domain', 2),
('Practical Application', 'Hands-on projects and real-world implementation', 3),
('Advanced & Research', 'Cutting-edge topics and research-oriented learning', 4);

-- Insert core resource categories
INSERT INTO public.resource_categories (name, description) VALUES
('Programming Fundamentals', 'Core programming skills and languages'),
('Mathematics & Statistics', 'Mathematical foundations for AI'),
('Machine Learning', 'Core ML concepts, algorithms, and frameworks'),
('Deep Learning', 'Neural networks and deep learning techniques'),
('Natural Language Processing', 'Text processing and language models'),
('Computer Vision', 'Image processing and visual AI'),
('Data Science & Engineering', 'Data handling, processing, and pipeline creation'),
('AI Ethics & Safety', 'Responsible AI development and deployment'),
('Tools & Frameworks', 'AI development tools and platforms'),
('Business & Strategy', 'AI in business context and strategy');

-- Insert learning domains
INSERT INTO public.learning_domains (name, description, is_foundational) VALUES
('Core AI Learning', 'Universal AI foundations for all learners', true),
('Healthcare AI', 'AI applications in medical and healthcare domains', false),
('Finance AI', 'AI in financial services and fintech', false),
('Marketing AI', 'AI for marketing automation and analytics', false),
('Education AI', 'AI applications in education and e-learning', false),
('Research & Academia', 'AI for research and academic applications', false);