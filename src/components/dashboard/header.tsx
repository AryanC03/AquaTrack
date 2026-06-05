"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface HeaderProps {
    title: string;
    description?: string;
}

export function Header({ title, description }: HeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        </header>
    );
}
