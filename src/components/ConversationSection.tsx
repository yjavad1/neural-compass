import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Sparkles, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationSectionProps {
  onComplete: (data: any) => void;
}

const ConversationSection: React.FC<ConversationSectionProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<'discovery' | 'clarification' | 'roadmap'>('discovery');
  const [isComplete, setIsComplete] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-conversation', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
      setPhase(data.phase);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualFallbacks = () => {
    const messageCount = messages.filter(m => m.role === 'user').length;
    
    if (messageCount <= 1) {
      return [
        "I'm completely new to AI and would like to start with the basics",
        "I have some technical background but want to learn about AI",
        "Can you explain what AI career options exist?",
        "I'm interested but not sure where to begin"
      ];
    } else if (messageCount <= 3) {
      return [
        "Could you give me some examples?",
        "What would you recommend for someone like me?",
        "I'd like to learn more about that",
        "How does that work in practice?"
      ];
    } else {
      return [
        "What are the next steps I should take?",
        "How long would that typically take?",
        "What resources would you recommend?",
        "Are there any prerequisites I should know about?"
      ];
    }
  };

  const loadSuggestions = async (aiMessage: string) => {
    if (!sessionId || isComplete) return;
    
    setIsLoadingSuggestions(true);
    try {
      // Add timeout for suggestions API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Suggestions timeout')), 8000)
      );

      const suggestionsPromise = supabase.functions.invoke('ai-suggestions', {
        body: {
          sessionId,
          aiQuestion: aiMessage,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      const { data, error } = await Promise.race([suggestionsPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Suggestions API error:', error);
        throw error;
      }

      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        console.warn('Invalid suggestions format:', data);
        setSuggestions(getContextualFallbacks());
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions(getContextualFallbacks());
      setShowSuggestions(true);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add timeout for API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 20000)
      );

      const apiPromise = supabase.functions.invoke('ai-conversation', {
        body: {
          action: 'send',
          message: userMessage.content,
          sessionId
        }
      });

      const { data, error } = await Promise.race([apiPromise, timeoutPromise]) as any;

      if (error) throw error;

      // Simulate typing delay
          setTimeout(async () => {
        setIsTyping(false);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setPhase(data.phase);
        
        // Set loading to false immediately after AI message to allow suggestion clicks
        setIsLoading(false);
        
        if (data.isComplete) {
          setIsComplete(true);
          // Generate advanced roadmap using the new function
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (profile) {
              const { data: roadmapData } = await supabase.functions.invoke('ai-roadmap-generator', {
                body: {
                  sessionId,
                  profileData: profile
                }
              });
              
              setTimeout(() => {
                onComplete({ 
                  phase: data.phase, 
                  sessionId, 
                  roadmap: roadmapData?.roadmap 
                });
              }, 1000);
            } else {
              setTimeout(() => {
                onComplete({ phase: data.phase, sessionId });
              }, 1000);
            }
          } catch (roadmapError) {
            console.error('Error generating roadmap:', roadmapError);
            setTimeout(() => {
              onComplete({ phase: data.phase, sessionId });
            }, 1000);
          }
        } else {
          // Load suggestions in background (don't block further interaction)
          const aiMessageToUse = data.message && data.message.trim() ? data.message : 
            (messages.length > 0 ? messages[messages.length - 1]?.content : 'continue conversation');
          loadSuggestions(aiMessageToUse);
        }
      }, 1000 + Math.random() * 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      let errorText = 'Failed to send message. Please try again.';
      if (error.message === 'Request timed out') {
        errorText = 'The response is taking too long. Please try again with a shorter message.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorText = 'Network error. Please check your connection and try again.';
      }
      
      toast({
        title: "Error",
        description: errorText,
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if we haven't already done so above
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Allow clicks even if suggestions are loading - just not if main conversation is loading
    if (isLoading) return;
    
    setInputValue(suggestion);
    setShowSuggestions(false);
    
    // Send message immediately - no timeout needed
    sendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'discovery': return 'Getting to know you';
      case 'clarification': return 'Understanding your goals';
      case 'roadmap': return 'Creating your roadmap';
      default: return 'Conversation';
    }
  };

  const getPhaseProgress = () => {
    switch (phase) {
      case 'discovery': return 33;
      case 'clarification': return 66;
      case 'roadmap': return 100;
      default: return 0;
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Let's Find Your AI Path
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              I'm your AI career advisor. Let's have a conversation about your background, interests, and goals to create a personalized roadmap into AI.
            </p>
          </div>
          
          <Button
            onClick={startConversation}
            disabled={isLoading}
            size="lg"
            className="px-8 py-4 text-lg"
          >
            {isLoading ? 'Starting conversation...' : 'Start Our Conversation'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">AI Career Conversation</h2>
            <div className="text-sm text-muted-foreground">
              {getPhaseLabel()}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getPhaseProgress()}%` }}
            />
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[600px] flex flex-col">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground ml-12' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted text-foreground rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && !isComplete && (
            <div className="border-t bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-4 h-4" />
                <span>Suggested responses:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left h-auto p-3 justify-start hover:bg-primary/5 border-dashed"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    <span className="text-sm text-foreground/80">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          {!isComplete && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or use a suggestion above..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Completion Message */}
          {isComplete && (
            <div className="border-t p-4 bg-muted/50">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">🎉 Conversation Complete!</p>
                <p className="text-xs text-muted-foreground">Your personalized AI roadmap is being generated...</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationSection;