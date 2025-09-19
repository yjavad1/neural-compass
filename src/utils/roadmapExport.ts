interface RoadmapData {
  role: string;
  difficulty: string;
  timeline: string;
  hiringOutlook: string;
  justification?: {
    whyThisPath: string;
    strengths: string[];
    alternativePaths: string[];
    whyNotAlternatives: string;
  };
  salary?: {
    entry: string;
    mid: string;
    senior: string;
  };
  phases: Array<{
    name: string;
    duration: string;
    objective: string;
    skills: string[];
    projects: Array<{
      title: string;
      description: string;
      keySkills: string[];
      portfolioValue: string;
    }>;
    resources: Array<{
      title: string;
      type: string;
      provider: string;
      url: string;
      estimatedTime: string;
      cost: string;
      difficulty: string;
      whyRecommended: string;
    }>;
  }>;
  nextSteps: string[];
}

export const exportRoadmapAsPDF = async (roadmapData: RoadmapData, userName?: string) => {
  try {
    // Create a clean HTML version for printing
    const printContent = generatePrintableHTML(roadmapData, userName);
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

export const shareRoadmap = async (roadmapData: RoadmapData, userName?: string) => {
  try {
    const shareData = {
      title: `${userName ? userName + "'s " : ""}AI Career Roadmap - ${roadmapData.role}`,
      text: `Check out this personalized AI career roadmap for becoming a ${roadmapData.role}! ${roadmapData.phases.length} phases, ${roadmapData.timeline} timeline.`,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } else if (navigator.clipboard) {
      // Fallback to clipboard
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: 'clipboard' };
    } else {
      throw new Error('Sharing not supported');
    }
  } catch (error) {
    console.error('Error sharing roadmap:', error);
    throw error;
  }
};

export const downloadRoadmapJSON = (roadmapData: RoadmapData, userName?: string) => {
  try {
    const dataStr = JSON.stringify(roadmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName ? userName.replace(/\s+/g, '_') + '_' : ''}ai_roadmap_${roadmapData.role.replace(/\s+/g, '_').toLowerCase()}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading JSON:', error);
    throw error;
  }
};

const generatePrintableHTML = (roadmapData: RoadmapData, userName?: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${userName ? userName + "'s " : ""}AI Career Roadmap</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 30px;
        }
        h3 {
            color: #1e3a8a;
            margin-top: 20px;
        }
        .header-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .phase {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .phase-header {
            background: #f1f5f9;
            padding: 15px;
            margin: -20px -20px 15px -20px;
            border-radius: 8px 8px 0 0;
        }
        .skills, .projects, .resources {
            margin: 15px 0;
        }
        .skill-item, .project-item, .resource-item {
            background: #f8fafc;
            padding: 10px;
            margin: 5px 0;
            border-left: 4px solid #2563eb;
        }
        .next-steps {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        ul {
            padding-left: 20px;
        }
        @page {
            margin: 1in;
        }
        @media print {
            body {
                font-size: 12pt;
            }
            .phase {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <h1>${userName ? userName + "'s " : ""}AI Career Roadmap</h1>
    
    <div class="header-info">
        <h2>${roadmapData.role}</h2>
        <p><strong>Difficulty Level:</strong> ${roadmapData.difficulty}</p>
        <p><strong>Estimated Timeline:</strong> ${roadmapData.timeline}</p>
        <p><strong>Job Market Outlook:</strong> ${roadmapData.hiringOutlook}</p>
        
        ${roadmapData.salary ? `
        <h3>Expected Salary Range</h3>
        <ul>
            <li><strong>Entry Level:</strong> ${roadmapData.salary.entry}</li>
            <li><strong>Mid Level:</strong> ${roadmapData.salary.mid}</li>
            <li><strong>Senior Level:</strong> ${roadmapData.salary.senior}</li>
        </ul>
        ` : ''}
    </div>

    ${roadmapData.justification ? `
    <h2>Why This Path?</h2>
    <p>${roadmapData.justification.whyThisPath}</p>
    
    <h3>Your Key Strengths</h3>
    <ul>
        ${roadmapData.justification.strengths.map(strength => `<li>${strength}</li>`).join('')}
    </ul>
    ` : ''}

    <h2>Learning Path (${roadmapData.phases.length} Phases)</h2>
    
    ${roadmapData.phases.map((phase, index) => `
    <div class="phase">
        <div class="phase-header">
            <h3>Phase ${index + 1}: ${phase.name}</h3>
            <p><strong>Duration:</strong> ${phase.duration}</p>
            <p><strong>Objective:</strong> ${phase.objective}</p>
        </div>
        
        <div class="skills">
            <h4>Key Skills (${phase.skills.length})</h4>
            ${phase.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
        </div>
        
        <div class="projects">
            <h4>Portfolio Projects</h4>
            ${phase.projects.map(project => `
            <div class="project-item">
                <strong>${project.title}</strong><br>
                ${project.description}<br>
                <em>Skills: ${project.keySkills.join(', ')}</em><br>
                <em>Portfolio Value: ${project.portfolioValue}</em>
            </div>
            `).join('')}
        </div>
        
        <div class="resources">
            <h4>Recommended Resources</h4>
            ${phase.resources.map(resource => `
            <div class="resource-item">
                <strong>${resource.title}</strong> (${resource.provider})<br>
                Type: ${resource.type} | Duration: ${resource.estimatedTime} | Cost: ${resource.cost}<br>
                ${resource.whyRecommended}<br>
                <em>URL: ${resource.url}</em>
            </div>
            `).join('')}
        </div>
    </div>
    `).join('')}
    
    <div class="next-steps">
        <h2>Immediate Next Steps</h2>
        <ol>
            ${roadmapData.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ol>
    </div>
    
    <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Generated on ${new Date().toLocaleDateString()} via AI Career Advisor</p>
    </div>
</body>
</html>
  `;
};