// Type definitions for roadmap data
interface Resource {
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'tool' | 'certification';
  provider: string;
  url: string;
  estimatedTime: string;
  cost: 'Free' | 'Paid' | 'Freemium';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  whyRecommended: string;
}

interface Project {
  title: string;
  description: string;
  keySkills: string[];
  portfolioValue: string;
}

interface Phase {
  name: string;
  duration: string;
  objective: string;
  skills: string[];
  projects: Project[];
  resources: Resource[];
  completed?: boolean;
}

interface Justification {
  whyThisPath: string;
  strengths: string[];
  alternativePaths: string[];
  whyNotAlternatives: string;
}

interface Salary {
  entry: string;
  mid: string;
  senior: string;
}

interface EnhancedRoadmapData {
  role: string;
  difficulty: string;
  timeline: string;
  hiringOutlook: string;
  justification: Justification;
  salary: Salary;
  phases: Phase[];
  nextSteps: string[];
}

// Sanitize project data that might have MaxDepthReached objects
const sanitizeProject = (project: any): Project => {
  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && value._type === 'MaxDepthReached') {
      return 'To be defined based on your learning progress';
    }
    return String(value || '');
  };

  const getArrayValue = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map(item => getStringValue(item)).filter(Boolean);
    }
    return [];
  };

  return {
    title: getStringValue(project?.title) || 'Project Planning Phase',
    description: getStringValue(project?.description) || 'Details will be provided as you progress through the learning phases.',
    keySkills: getArrayValue(project?.keySkills),
    portfolioValue: getStringValue(project?.portfolioValue) || 'Will enhance your portfolio and demonstrate practical skills'
  };
};

// Sanitize resource data that might be missing or malformed
const sanitizeResource = (resource: any): Resource => {
  return {
    title: resource?.title || 'Resource',
    type: resource?.type || 'course',
    provider: resource?.provider || 'Various',
    url: resource?.url || '#',
    estimatedTime: resource?.estimatedTime || 'TBD',
    cost: resource?.cost || 'Free',
    difficulty: resource?.difficulty || 'Beginner',
    whyRecommended: resource?.whyRecommended || 'Recommended for foundational learning'
  };
};

// Sanitize phase data
const sanitizePhase = (phase: any): Phase => {
  const projects = Array.isArray(phase?.projects) 
    ? phase.projects.map(sanitizeProject)
    : [];

  const resources = Array.isArray(phase?.resources) 
    ? phase.resources.map(sanitizeResource)
    : [];

  const skills = Array.isArray(phase?.skills) 
    ? phase.skills.filter(skill => typeof skill === 'string' && skill.length > 0)
    : [];

  return {
    name: phase?.name || 'Learning Phase',
    duration: phase?.duration || 'TBD',
    objective: phase?.objective || 'Build foundational knowledge and skills',
    skills,
    projects,
    resources,
    completed: false
  };
};

// Main sanitization function
export const sanitizeRoadmapData = (data: any): EnhancedRoadmapData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid roadmap data provided');
  }

  const phases = Array.isArray(data.phases) 
    ? data.phases.map(sanitizePhase)
    : [];

  const nextSteps = Array.isArray(data.nextSteps)
    ? data.nextSteps.filter(step => typeof step === 'string' && step.length > 0)
    : ['Start with Phase 1 of your learning journey'];

  return {
    role: data.role || 'AI Professional',
    difficulty: data.difficulty || 'Intermediate',
    timeline: data.timeline || '6-12 months',
    hiringOutlook: data.hiringOutlook || 'Strong',
    justification: {
      whyThisPath: data.justification?.whyThisPath || 'This path aligns with current market demands and your background.',
      strengths: Array.isArray(data.justification?.strengths) 
        ? data.justification.strengths.filter(s => typeof s === 'string') 
        : [],
      alternativePaths: Array.isArray(data.justification?.alternativePaths)
        ? data.justification.alternativePaths.filter(s => typeof s === 'string')
        : [],
      whyNotAlternatives: data.justification?.whyNotAlternatives || 'The selected path offers the best balance of learning curve and market opportunity.'
    },
    salary: {
      entry: data.salary?.entry || '$60,000-80,000',
      mid: data.salary?.mid || '$80,000-120,000',
      senior: data.salary?.senior || '$120,000+'
    },
    phases,
    nextSteps
  };
};