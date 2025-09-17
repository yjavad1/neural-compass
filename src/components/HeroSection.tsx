import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-ai-career.jpg";

interface HeroSectionProps {
  onStartQuiz: () => void;
}

export const HeroSection = ({ onStartQuiz }: HeroSectionProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-ai-primary/90 via-ai-secondary/80 to-ai-accent/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Find Your
          <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            AI Career Path
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
          Discover your ideal entry point into artificial intelligence. Get a personalized roadmap, 
          role recommendations, and step-by-step guidance tailored to your background and goals.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            variant="hero"
            onClick={onStartQuiz}
            className="text-lg px-8 py-6 min-w-[200px]"
          >
            Start Your Journey
          </Button>
          <Button 
            size="lg" 
            variant="outline-hero"
            className="text-lg px-8 py-6 min-w-[200px]"
          >
            Learn More
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">10K+</div>
            <div className="text-white/80">Career Paths Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">50+</div>
            <div className="text-white/80">AI Roles Mapped</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">95%</div>
            <div className="text-white/80">Success Rate</div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
};