"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Image as ImageIcon, Lightbulb, Mic, MoreHorizontal, Plus, Search, Send, Sparkles } from "lucide-react";

export function AICommandBar() {
  const actionButtons = [
    { icon: Lightbulb, label: "Deep Research" },
    { icon: ImageIcon, label: "Make an Image" },
    { icon: Search, label: "Search" },
    { icon: MoreHorizontal, label: "More" },
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm">
        <div className="relative mx-auto max-w-4xl p-4">
            <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
                    <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Unlock more with Pro Plan</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        <span>Powered by Assistant v2.6</span>
                    </div>
                </div>

                <div className="relative flex w-full items-center rounded-full border bg-background p-2 pl-4 shadow-sm">
                    <button className="text-muted-foreground transition-colors hover:text-foreground">
                        <Plus className="h-5 w-5" />
                        <span className="sr-only">Add content</span>
                    </button>
                    <Input
                        placeholder='Example: "Who are the most overdue students for assessments this week?"'
                        className="flex-1 border-0 bg-transparent text-base shadow-none ring-0 placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
                            <Mic className="h-4 w-4" />
                            <span className="sr-only">Use microphone</span>
                        </Button>
                        <Button size="icon" className="h-8 w-8 shrink-0 rounded-full">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                    {actionButtons.map((action, index) => (
                        <Button key={index} variant="secondary" size="sm" className="rounded-full">
                           <action.icon className="mr-2 h-4 w-4" />
                           {action.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
