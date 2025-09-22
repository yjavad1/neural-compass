// Curated resource templates with verified URLs from major platforms
export interface ResourceTemplate {
  title: string;
  type: 'course' | 'tutorial' | 'practice' | 'book' | 'tool';
  provider: 'Coursera' | 'edX' | 'Udemy' | 'Khan Academy';
  url: string;
  estimatedTime: string;
  cost: 'Free' | 'Paid' | 'Freemium';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  whyRecommended: string;
}

// Curated resource templates organized by category
export const RESOURCE_TEMPLATES: Record<string, ResourceTemplate[]> = {
  'ai-fundamentals': [
    {
      title: 'Machine Learning Course',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/machine-learning',
      estimatedTime: '11 weeks',
      cost: 'Freemium',
      difficulty: 'Beginner',
      topics: ['machine learning', 'ai', 'algorithms'],
      whyRecommended: 'Comprehensive introduction to ML concepts with hands-on programming assignments'
    },
    {
      title: 'Introduction to Artificial Intelligence',
      type: 'course',
      provider: 'edX',
      url: 'https://www.edx.org/course/artificial-intelligence-ai',
      estimatedTime: '8 weeks',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['artificial intelligence', 'ai basics'],
      whyRecommended: 'Solid foundation in AI principles and applications'
    },
    {
      title: 'Complete AI & Machine Learning Bootcamp',
      type: 'course',
      provider: 'Udemy',
      url: 'https://www.udemy.com/course/complete-machine-learning-and-data-science-bootcamp-to-mastership/',
      estimatedTime: '40 hours',
      cost: 'Paid',
      difficulty: 'Intermediate',
      topics: ['machine learning', 'data science', 'python'],
      whyRecommended: 'Comprehensive bootcamp covering practical ML implementation'
    }
  ],
  'python-programming': [
    {
      title: 'Programming for Everybody (Getting Started with Python)',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/python',
      estimatedTime: '7 weeks',
      cost: 'Freemium',
      difficulty: 'Beginner',
      topics: ['python', 'programming', 'basics'],
      whyRecommended: 'Perfect introduction to Python programming for beginners'
    },
    {
      title: 'Introduction to Computer Science and Programming Using Python',
      type: 'course',
      provider: 'edX',
      url: 'https://www.edx.org/course/introduction-to-computer-science-and-programming-7',
      estimatedTime: '9 weeks',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['python', 'computer science', 'programming'],
      whyRecommended: 'MIT-quality computer science education with Python'
    },
    {
      title: 'Intro to Programming',
      type: 'course',
      provider: 'Khan Academy',
      url: 'https://www.khanacademy.org/computing/intro-to-programming',
      estimatedTime: 'Self-paced',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['programming', 'basics', 'javascript'],
      whyRecommended: 'Interactive programming fundamentals with immediate feedback'
    }
  ],
  'data-science': [
    {
      title: 'IBM Data Science Professional Certificate',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/professional-certificates/ibm-data-science',
      estimatedTime: '6 months',
      cost: 'Paid',
      difficulty: 'Intermediate',
      topics: ['data science', 'python', 'machine learning'],
      whyRecommended: 'Industry-recognized certificate with hands-on projects'
    },
    {
      title: 'Data Science MicroMasters',
      type: 'course',
      provider: 'edX',
      url: 'https://www.edx.org/micromasters/mitx-statistics-and-data-science',
      estimatedTime: '1 year',
      cost: 'Paid',
      difficulty: 'Advanced',
      topics: ['data science', 'statistics', 'machine learning'],
      whyRecommended: 'MIT-level data science program with rigorous curriculum'
    },
    {
      title: 'Python for Data Science and Machine Learning Bootcamp',
      type: 'course',
      provider: 'Udemy',
      url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
      estimatedTime: '25 hours',
      cost: 'Paid',
      difficulty: 'Intermediate',
      topics: ['python', 'data science', 'machine learning'],
      whyRecommended: 'Comprehensive practical training with real-world projects'
    }
  ],
  'web-development': [
    {
      title: 'HTML, CSS, and Javascript for Web Developers',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/html-css-javascript-for-web-developers',
      estimatedTime: '5 weeks',
      cost: 'Freemium',
      difficulty: 'Beginner',
      topics: ['html', 'css', 'javascript', 'web development'],
      whyRecommended: 'Complete foundation for modern web development'
    },
    {
      title: 'Introduction to Web Development',
      type: 'course',
      provider: 'edX',
      url: 'https://www.edx.org/course/introduction-to-web-development',
      estimatedTime: '6 weeks',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['web development', 'html', 'css'],
      whyRecommended: 'Structured approach to learning web fundamentals'
    },
    {
      title: 'Intro to HTML/CSS: Making webpages',
      type: 'course',
      provider: 'Khan Academy',
      url: 'https://www.khanacademy.org/computing/computer-programming/html-css',
      estimatedTime: 'Self-paced',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['html', 'css', 'web design'],
      whyRecommended: 'Interactive tutorials with immediate visual feedback'
    }
  ],
  'business-analytics': [
    {
      title: 'Business Analytics Specialization',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/specializations/business-analytics',
      estimatedTime: '4 months',
      cost: 'Paid',
      difficulty: 'Intermediate',
      topics: ['business analytics', 'data analysis', 'excel'],
      whyRecommended: 'Comprehensive business analytics skills for decision making'
    },
    {
      title: 'Analytics for Decision Making',
      type: 'course',
      provider: 'edX',
      url: 'https://www.edx.org/course/analytics-for-decision-making',
      estimatedTime: '8 weeks',
      cost: 'Free',
      difficulty: 'Intermediate',
      topics: ['analytics', 'decision making', 'business intelligence'],
      whyRecommended: 'Learn to make data-driven business decisions'
    }
  ],
  'statistics': [
    {
      title: 'Introduction to Statistics',
      type: 'course',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/stanford-statistics',
      estimatedTime: '8 weeks',
      cost: 'Freemium',
      difficulty: 'Beginner',
      topics: ['statistics', 'data analysis', 'probability'],
      whyRecommended: 'Stanford-quality statistics education with practical applications'
    },
    {
      title: 'Statistics and Probability',
      type: 'course',
      provider: 'Khan Academy',
      url: 'https://www.khanacademy.org/math/statistics-probability',
      estimatedTime: 'Self-paced',
      cost: 'Free',
      difficulty: 'Beginner',
      topics: ['statistics', 'probability', 'mathematics'],
      whyRecommended: 'Interactive lessons building from basics to advanced concepts'
    }
  ]
};

// Platform fallback URLs for when no specific course matches
export const PLATFORM_FALLBACKS: Record<string, string> = {
  'Coursera': 'https://www.coursera.org/browse/data-science',
  'edX': 'https://www.edx.org/learn/data-analysis',
  'Udemy': 'https://www.udemy.com/courses/development/',
  'Khan Academy': 'https://www.khanacademy.org/computing'
};

// Match topics to resource categories
export const matchTopicToCategory = (topic: string): string => {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('python') || topicLower.includes('programming') || topicLower.includes('coding')) {
    return 'python-programming';
  }
  if (topicLower.includes('machine learning') || topicLower.includes('ai') || topicLower.includes('artificial intelligence')) {
    return 'ai-fundamentals';
  }
  if (topicLower.includes('data science') || topicLower.includes('data analysis')) {
    return 'data-science';
  }
  if (topicLower.includes('web') || topicLower.includes('html') || topicLower.includes('css') || topicLower.includes('javascript')) {
    return 'web-development';
  }
  if (topicLower.includes('business') || topicLower.includes('analytics') || topicLower.includes('product')) {
    return 'business-analytics';
  }
  if (topicLower.includes('statistics') || topicLower.includes('probability') || topicLower.includes('math')) {
    return 'statistics';
  }
  
  return 'ai-fundamentals'; // default fallback
};

// Get curated resources for a specific topic/skill
export const getCuratedResources = (skills: string[], maxResources: number = 3): ResourceTemplate[] => {
  const selectedResources: ResourceTemplate[] = [];
  const usedCategories = new Set<string>();
  
  // Try to match each skill to a category and get resources
  for (const skill of skills) {
    const category = matchTopicToCategory(skill);
    
    if (!usedCategories.has(category) && RESOURCE_TEMPLATES[category]) {
      // Get resources from this category
      const categoryResources = RESOURCE_TEMPLATES[category];
      const resourceCount = Math.min(2, categoryResources.length);
      
      for (let i = 0; i < resourceCount && selectedResources.length < maxResources; i++) {
        selectedResources.push(categoryResources[i]);
      }
      
      usedCategories.add(category);
    }
    
    if (selectedResources.length >= maxResources) break;
  }
  
  // Fill remaining slots with AI fundamentals if needed
  if (selectedResources.length < maxResources && !usedCategories.has('ai-fundamentals')) {
    const remaining = maxResources - selectedResources.length;
    const aiResources = RESOURCE_TEMPLATES['ai-fundamentals'].slice(0, remaining);
    selectedResources.push(...aiResources);
  }
  
  return selectedResources;
};