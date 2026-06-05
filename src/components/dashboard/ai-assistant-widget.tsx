
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatWithAssistant } from '@/ai/flows/assistant-chat-flow';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function AIAssistantWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm the AquaTrack Assistant. How can I help you manage your swim school today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({
        history: messages,
        message: input,
      });
      const assistantMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error chatting with assistant:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get a response from the assistant.",
      });
       // Restore user message to input if API fails
       setMessages(prev => prev.slice(0, -1));
       setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="flex flex-col h-full max-h-[75vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span>AquaTrack Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/logo.png" alt="AquaTrack Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg px-4 py-2 text-sm md:max-w-md',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/logo.png" alt="AquaTrack Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/50" />
                    </div>
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about swim school management..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
