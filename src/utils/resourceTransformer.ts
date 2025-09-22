// Transform LLM resource data to UI format
interface LLMResource {
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'tool' | 'certification';
  provider: string;
  url: string;
  estimatedTime: string;
  cost: 'Free' | 'Paid' | 'Freemium';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  whyRecommended: string;
}

interface UIResource {
  title: string;
  type: 'course' | 'tutorial' | 'practice' | 'community' | 'book' | 'tool';
  provider: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  cost: 'Free' | 'Paid' | 'Freemium';
  rating: number;
  url: string;
  description: string;
}

// Generate realistic rating based on provider and type
const generateRating = (provider: string, type: string): number => {
  const providerRatings: Record<string, number> = {
    'Coursera': 4.5,
    'edX': 4.3,
    'Udemy': 4.2,
    'Khan Academy': 4.4,
    'FreeCodeCamp': 4.6,
    'YouTube': 4.0,
    'MIT OpenCourseWare': 4.7,
    'Stanford Online': 4.6,
    'Google': 4.4,
    'IBM': 4.2,
    'Microsoft': 4.3,
    'Amazon': 4.1,
    'Kaggle': 4.3,
    'GitHub': 4.2,
    'Documentation': 4.0,
  };

  const baseRating = providerRatings[provider] || 4.0;
  const variation = (Math.random() - 0.5) * 0.4; // ±0.2 variation
  return Math.round((baseRating + variation) * 10) / 10;
};

// Enhanced URL validation with blacklist patterns
const validateAndFixUrl = (url: string, provider: string, title: string): string => {
  if (!url || url === '#' || url === 'TBD' || url.includes('example.com')) {
    return generateProviderUrl(provider, title);
  }

  // Blacklist patterns for generic/trending/search pages
  const blacklistPatterns = [
    '/trending',
    '/papers/trending',
    '/search',
    '/browse',
    '/explore',
    '/popular',
    '/latest',
    '/hot',
    '/featured'
  ];

  // Check if URL contains blacklisted patterns
  const hasBlacklistedPattern = blacklistPatterns.some(pattern => 
    url.toLowerCase().includes(pattern)
  );

  if (hasBlacklistedPattern) {
    console.log(`🚫 Blacklisted URL detected: ${url}, generating fallback`);
    return generateProviderUrl(provider, title);
  }

  // Basic URL validation
  try {
    const urlObj = new URL(url);
    
    // Check domain consistency with provider
    const domainMap: Record<string, string[]> = {
      'Coursera': ['coursera.org'],
      'edX': ['edx.org'],
      'Udemy': ['udemy.com'],
      'YouTube': ['youtube.com', 'youtu.be'],
      'Khan Academy': ['khanacademy.org'],
      'FreeCodeCamp': ['freecodecamp.org'],
      'MIT OpenCourseWare': ['ocw.mit.edu'],
      'Stanford Online': ['online.stanford.edu'],
      'Kaggle': ['kaggle.com'],
      'GitHub': ['github.com'],
      'HuggingFace': ['huggingface.co']
    };

    const expectedDomains = domainMap[provider];
    if (expectedDomains && !expectedDomains.some(domain => urlObj.hostname.includes(domain))) {
      console.log(`🚫 Domain mismatch for ${provider}: ${urlObj.hostname}, generating fallback`);
      return generateProviderUrl(provider, title);
    }

    return url;
  } catch {
    return generateProviderUrl(provider, title);
  }
};

// Generate provider-specific search URLs for invalid links
const generateProviderUrl = (provider: string, title: string): string => {
  const searchQuery = encodeURIComponent(title.toLowerCase().replace(/[^\w\s]/g, ''));
  
  const providerUrls: Record<string, string> = {
    'Coursera': `https://www.coursera.org/search?query=${searchQuery}`,
    'edX': `https://www.edx.org/search?q=${searchQuery}`,
    'Udemy': `https://www.udemy.com/courses/search/?q=${searchQuery}`,
    'Khan Academy': `https://www.khanacademy.org/search?page_search_query=${searchQuery}`,
    'FreeCodeCamp': `https://www.freecodecamp.org/learn`,
    'YouTube': `https://www.youtube.com/results?search_query=${searchQuery}`,
    'MIT OpenCourseWare': `https://ocw.mit.edu/search/?q=${searchQuery}`,
    'Stanford Online': `https://online.stanford.edu/search-catalog?keywords=${searchQuery}`,
    'Google': `https://developers.google.com/machine-learning`,
    'IBM': `https://www.ibm.com/training/search?query=${searchQuery}`,
    'Microsoft': `https://docs.microsoft.com/en-us/learn/browse/?terms=${searchQuery}`,
    'Amazon': `https://aws.amazon.com/training/`,
    'Kaggle': `https://www.kaggle.com/learn`,
    'GitHub': `https://github.com/search?q=${searchQuery}&type=repositories`,
    'Documentation': `https://www.google.com/search?q=${searchQuery}+documentation`,
  };

  return providerUrls[provider] || `https://www.google.com/search?q=${searchQuery}`;
};

// Map LLM type to UI type
const mapResourceType = (llmType: string): UIResource['type'] => {
  const typeMap: Record<string, UIResource['type']> = {
    'course': 'course',
    'tutorial': 'tutorial',
    'book': 'book',
    'tool': 'tool',
    'certification': 'course',
    'practice': 'practice',
    'community': 'community'
  };

  return typeMap[llmType] || 'course';
};

// Transform a single resource
export const transformResource = (llmResource: Partial<LLMResource>): UIResource => {
  const title = llmResource.title || 'Learning Resource';
  const provider = llmResource.provider || 'Various';
  const type = mapResourceType(llmResource.type || 'course');
  
  return {
    title,
    type,
    provider,
    duration: llmResource.estimatedTime || 'Self-paced',
    difficulty: llmResource.difficulty || 'Beginner',
    cost: llmResource.cost || 'Free',
    rating: generateRating(provider, type),
    url: validateAndFixUrl(llmResource.url || '', provider, title),
    description: llmResource.whyRecommended || 'Recommended for building foundational knowledge and practical skills in this area.'
  };
};

// Transform an array of resources
export const transformResources = (llmResources: Partial<LLMResource>[]): UIResource[] => {
  return llmResources.map(transformResource);
};

// Transform entire phase resources
export const transformPhaseResources = (phases: any[]): any[] => {
  return phases.map(phase => ({
    ...phase,
    resources: transformResources(phase.resources || [])
  }));
};