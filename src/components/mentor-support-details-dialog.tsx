
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import type { MentorSupportEntry } from '@/lib/types';
import { Button } from './ui/button';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMentorSuggestions, type GenerateMentorSuggestionsOutput } from '@/ai/flows/generate-mentor-suggestions-flow';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface MentorSupportDetailsDialogProps {
  request: MentorSupportEntry | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function MentorSupportDetailsDialog({ request, isOpen, onOpenChange }: MentorSupportDetailsDialogProps) {
  const [suggestions, setSuggestions] = useState<GenerateMentorSuggestionsOutput['suggestions'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSuggestions = async () => {
    if (!request) return;
    setIsLoading(true);
    setSuggestions(null);

    try {
      const result = await generateMentorSuggestions({
        problemDescription: request.reason,
        levelName: request.level,
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: `Could not generate suggestions. Error: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitle = useMemo(() => {
    if (!request) return "Mentor Support Request";
    return `Support for ${request.teacherName} - ${request.level}`;
  }, [request]);

  // Clear state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSuggestions(null);
      setIsLoading(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Original request and AI-powered coaching suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto space-y-6 pr-4 -mr-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Request</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{request?.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles />
                  AI-Powered Suggestions
                </CardTitle>
                <Button onClick={handleGenerateSuggestions} disabled={isLoading} size="sm">
                  {isLoading ? 'Generating...' : 'Get AI Suggestions'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : suggestions ? (
                <Accordion type="single" collapsible className="w-full">
                  {suggestions.map((suggestion, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>{suggestion.title}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {suggestion.description}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Ready for Ideas?</AlertTitle>
                  <AlertDescription>
                    Click the "Get AI Suggestions" button to generate coaching tips for this request.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
