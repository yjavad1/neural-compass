import { useState, useCallback, useEffect } from 'react';

interface ProgressData {
  completedPhases: number[];
  completedProjects: Record<number, number[]>; // phaseIndex -> projectIndices
  completedResources: Record<number, number[]>; // phaseIndex -> resourceIndices
  startedAt: string;
  lastUpdated: string;
}

export const useRoadmapProgress = (sessionId: string) => {
  const [progress, setProgress] = useState<ProgressData>({
    completedPhases: [],
    completedProjects: {},
    completedResources: {},
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const storageKey = `roadmap-progress-${sessionId}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress(parsed);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  }, [sessionId]);

  // Save progress to localStorage whenever it changes
  const saveProgress = useCallback((newProgress: ProgressData) => {
    const storageKey = `roadmap-progress-${sessionId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [sessionId]);

  const togglePhaseComplete = useCallback((phaseIndex: number) => {
    setProgress(prev => {
      const isCompleted = prev.completedPhases.includes(phaseIndex);
      const completedPhases = isCompleted 
        ? prev.completedPhases.filter(i => i !== phaseIndex)
        : [...prev.completedPhases, phaseIndex];
      
      const newProgress = {
        ...prev,
        completedPhases,
        lastUpdated: new Date().toISOString()
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  const toggleProjectComplete = useCallback((phaseIndex: number, projectIndex: number) => {
    setProgress(prev => {
      const phaseProjects = prev.completedProjects[phaseIndex] || [];
      const isCompleted = phaseProjects.includes(projectIndex);
      
      const newPhaseProjects = isCompleted
        ? phaseProjects.filter(i => i !== projectIndex)
        : [...phaseProjects, projectIndex];
      
      const newProgress = {
        ...prev,
        completedProjects: {
          ...prev.completedProjects,
          [phaseIndex]: newPhaseProjects
        },
        lastUpdated: new Date().toISOString()
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  const toggleResourceComplete = useCallback((phaseIndex: number, resourceIndex: number) => {
    setProgress(prev => {
      const phaseResources = prev.completedResources[phaseIndex] || [];
      const isCompleted = phaseResources.includes(resourceIndex);
      
      const newPhaseResources = isCompleted
        ? phaseResources.filter(i => i !== resourceIndex)
        : [...phaseResources, resourceIndex];
      
      const newProgress = {
        ...prev,
        completedResources: {
          ...prev.completedResources,
          [phaseIndex]: newPhaseResources
        },
        lastUpdated: new Date().toISOString()
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  const getPhaseProgress = useCallback((phaseIndex: number, totalProjects: number, totalResources: number) => {
    const completedProjects = progress.completedProjects[phaseIndex]?.length || 0;
    const completedResources = progress.completedResources[phaseIndex]?.length || 0;
    const totalItems = totalProjects + totalResources;
    const completedItems = completedProjects + completedResources;
    
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  }, [progress]);

  const getOverallProgress = useCallback((totalPhases: number) => {
    return totalPhases > 0 ? (progress.completedPhases.length / totalPhases) * 100 : 0;
  }, [progress.completedPhases.length]);

  const isPhaseCompleted = useCallback((phaseIndex: number) => {
    return progress.completedPhases.includes(phaseIndex);
  }, [progress.completedPhases]);

  const isProjectCompleted = useCallback((phaseIndex: number, projectIndex: number) => {
    return progress.completedProjects[phaseIndex]?.includes(projectIndex) || false;
  }, [progress.completedProjects]);

  const isResourceCompleted = useCallback((phaseIndex: number, resourceIndex: number) => {
    return progress.completedResources[phaseIndex]?.includes(resourceIndex) || false;
  }, [progress.completedResources]);

  const getNextActionablePhase = useCallback(() => {
    // Find the first phase that's not completed
    for (let i = 0; i < 10; i++) { // Assuming max 10 phases
      if (!progress.completedPhases.includes(i)) {
        return i;
      }
    }
    return 0; // Default to first phase
  }, [progress.completedPhases]);

  const resetProgress = useCallback(() => {
    const newProgress: ProgressData = {
      completedPhases: [],
      completedProjects: {},
      completedResources: {},
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [saveProgress]);

  return {
    progress,
    togglePhaseComplete,
    toggleProjectComplete,
    toggleResourceComplete,
    getPhaseProgress,
    getOverallProgress,
    isPhaseCompleted,
    isProjectCompleted,
    isResourceCompleted,
    getNextActionablePhase,
    resetProgress
  };
};