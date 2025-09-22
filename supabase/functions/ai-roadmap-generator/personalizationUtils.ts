// Utility functions for processing user data and creating personalized content

interface PersonaData {
  name?: string;
  background?: string[];
  coding?: string;
  math?: string;
  goal?: string;
  interests?: string[];
  hours_per_week?: number;
  constraints?: string[];
  timeline_months?: number;
}

// Convert raw background input to proper descriptive text
export function processBackground(background: string[]): string {
  if (!background || background.length === 0) return 'your professional background';
  
  const cleanedBackground = background[0]
    .toLowerCase()
    .replace(/^i am a?/, '')
    .replace(/^i'm a?/, '')
    .replace(/^i work as a?/, '')
    .trim();
  
  // Handle articles properly
  const needsArticle = /^[aeiou]/.test(cleanedBackground);
  const article = needsArticle ? 'an' : 'a';
  
  return `your background as ${article} ${cleanedBackground}`;
}

// Convert interests to natural language
export function processInterests(interests: string[]): string {
  if (!interests || interests.length === 0) return 'technology';
  
  if (interests.length === 1) return interests[0];
  if (interests.length === 2) return `${interests[0]} and ${interests[1]}`;
  
  const lastInterest = interests[interests.length - 1];
  const otherInterests = interests.slice(0, -1).join(', ');
  return `${otherInterests}, and ${lastInterest}`;
}

// Generate meaningful role-background connections
export function generateRoleConnection(role: string, background: string, interests: string[]): string {
  const backgroundLower = background.toLowerCase();
  const roleLower = role.toLowerCase();
  
  // Define connection patterns
  const connections: Record<string, Record<string, string>> = {
    'ai tools mastery': {
      'mechanic': 'Your hands-on mechanical expertise translates perfectly to understanding how AI tools can optimize workflows and solve practical problems',
      'teacher': 'Your educational experience provides a strong foundation for understanding how AI tools can enhance learning and productivity',
      'healthcare': 'Your healthcare background positions you to leverage AI tools for improving patient care and medical workflows',
      'business': 'Your business experience gives you the perfect perspective to identify how AI tools can drive efficiency and innovation',
      'default': 'Your professional experience provides valuable context for understanding how AI tools can solve real-world challenges'
    },
    'ai for healthcare': {
      'doctor': 'Your medical expertise is exactly what\'s needed to effectively implement AI solutions in healthcare settings',
      'nurse': 'Your clinical experience provides crucial insights into how AI can improve patient care and medical workflows',
      'healthcare': 'Your healthcare background gives you the domain knowledge essential for successful AI implementation in medical settings',
      'default': 'Your interest in healthcare combined with AI creates opportunities to make meaningful impact in medical technology'
    },
    'data scientist': {
      'analyst': 'Your analytical background provides the perfect foundation for transitioning into advanced data science roles',
      'researcher': 'Your research experience translates directly to the experimental and analytical nature of data science',
      'business': 'Your business background helps you understand the commercial applications of data science insights',
      'default': 'Your analytical mindset and problem-solving skills align perfectly with data science methodologies'
    }
  };
  
  const roleConnections = connections[roleLower] || connections['ai tools mastery'];
  
  // Find the best match for background
  for (const bgKey in roleConnections) {
    if (backgroundLower.includes(bgKey)) {
      return roleConnections[bgKey];
    }
  }
  
  return roleConnections['default'];
}

// Generate personalized strengths based on background and coding level
export function generatePersonalizedStrengths(persona: PersonaData): string[] {
  const strengths: string[] = [];
  const background = persona.background?.[0]?.toLowerCase() || '';
  const coding = persona.coding || 'none';
  const hours = persona.hours_per_week || 10;
  
  // Background-based strengths
  if (background.includes('mechanic') || background.includes('engineer')) {
    strengths.push('Strong problem-solving and systematic thinking from technical background');
  } else if (background.includes('teacher') || background.includes('education')) {
    strengths.push('Excellent communication skills and ability to break down complex concepts');
  } else if (background.includes('business') || background.includes('manager')) {
    strengths.push('Strategic thinking and understanding of business applications');
  } else if (background.includes('healthcare') || background.includes('doctor') || background.includes('nurse')) {
    strengths.push('Domain expertise in a high-impact AI application area');
  } else {
    strengths.push('Diverse professional experience bringing unique perspectives to AI solutions');
  }
  
  // Coding-based strengths
  if (coding === 'advanced') {
    strengths.push('Strong programming foundation enabling rapid AI skill development');
  } else if (coding === 'intermediate' || coding === 'some') {
    strengths.push('Existing coding knowledge provides a solid technical foundation');
  } else {
    strengths.push('Fresh perspective unburdened by existing programming assumptions');
  }
  
  // Time commitment strength
  if (hours >= 15) {
    strengths.push('Significant time commitment showing serious dedication to career transition');
  } else if (hours >= 10) {
    strengths.push('Balanced learning schedule allowing for steady, sustainable progress');
  } else {
    strengths.push('Focused learning approach making efficient use of available time');
  }
  
  return strengths.slice(0, 3); // Limit to 3 most relevant strengths
}

// Generate contextual justification
export function generateJustification(persona: PersonaData, role: string): any {
  const background = processBackground(persona.background || []);
  const interests = processInterests(persona.interests || []);
  const connection = generateRoleConnection(role, persona.background?.[0] || '', persona.interests || []);
  const strengths = generatePersonalizedStrengths(persona);
  
  return {
    whyThisPath: `${connection}. Your interest in ${interests} further strengthens this career direction, creating a powerful combination of domain knowledge and emerging technology skills.`,
    strengths: strengths,
    alternativePaths: getAlternativePaths(role),
    whyNotAlternatives: `While these alternatives are valuable, your specific combination of ${background} and interest in ${interests} makes ${role} the most direct path to leveraging your existing expertise while building cutting-edge AI skills.`
  };
}

// Get relevant alternative paths based on role
function getAlternativePaths(role: string): string[] {
  const alternatives: Record<string, string[]> = {
    'AI Tools Mastery': ['AI for Business', 'Data Analyst', 'AI Automation Specialist'],
    'AI for Healthcare': ['Health Data Analyst', 'Medical AI Researcher', 'Digital Health Specialist'],
    'Data Scientist': ['Machine Learning Engineer', 'AI Research Scientist', 'Business Intelligence Analyst'],
    'Machine Learning Engineer': ['Data Scientist', 'AI Software Engineer', 'Research Scientist'],
    'AI for Business': ['Business Data Analyst', 'AI Strategy Consultant', 'Product Manager (AI)']
  };
  
  return alternatives[role] || ['Data Scientist', 'Machine Learning Engineer', 'AI Specialist'];
}

// Generate personalized timeline based on constraints
export function calculatePersonalizedTimeline(persona: PersonaData): string {
  const baseTimeline = persona.timeline_months || 6;
  const hours = persona.hours_per_week || 10;
  const coding = persona.coding || 'none';
  const constraints = persona.constraints || [];
  
  let adjustedTimeline = baseTimeline;
  
  // Adjust for time availability
  if (hours >= 20) {
    adjustedTimeline = Math.max(3, baseTimeline - 2);
  } else if (hours <= 5) {
    adjustedTimeline = baseTimeline + 3;
  }
  
  // Adjust for coding experience
  if (coding === 'advanced') {
    adjustedTimeline = Math.max(3, adjustedTimeline - 1);
  } else if (coding === 'none') {
    adjustedTimeline = adjustedTimeline + 1;
  }
  
  // Adjust for constraints
  if (constraints.includes('urgent')) {
    adjustedTimeline = Math.max(3, adjustedTimeline - 1);
  }
  
  const minTime = adjustedTimeline;
  const maxTime = adjustedTimeline + 2;
  
  return `${minTime}-${maxTime} months`;
}