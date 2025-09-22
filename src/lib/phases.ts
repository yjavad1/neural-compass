// lib/phases.ts - Dynamic phase system
export const PHASE_TYPES = [
  "Foundation",
  "Practice", 
  "Specialization",
  "Application",
  "Advanced",
  "Portfolio"
] as const;

export type PhaseType = typeof PHASE_TYPES[number];

export function getPhaseTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'foundation': 'bg-blue-50 border-blue-200 text-blue-800',
    'practice': 'bg-green-50 border-green-200 text-green-800', 
    'specialization': 'bg-purple-50 border-purple-200 text-purple-800',
    'application': 'bg-orange-50 border-orange-200 text-orange-800',
    'advanced': 'bg-red-50 border-red-200 text-red-800',
    'portfolio': 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  
  const normalized = type.toLowerCase();
  return colorMap[normalized] || 'bg-gray-50 border-gray-200 text-gray-800';
}

export function getPhaseIcon(name: string): string {
  const n = name.toLowerCase();
  if (/foundation|core|basics/.test(n)) return '🎯';
  if (/practice|hands|coding/.test(n)) return '💻';
  if (/special|deep|focus/.test(n)) return '🔬';
  if (/application|project|build/.test(n)) return '🚀';
  if (/advanced|research|expert/.test(n)) return '🧠';
  if (/portfolio|capstone|job/.test(n)) return '📁';
  return '📚';
}