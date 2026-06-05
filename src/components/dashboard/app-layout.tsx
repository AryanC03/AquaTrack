"use client";

import React from 'react';
import { Header } from './header';

interface AppLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export function AppLayout({ title, description, children }: AppLayoutProps) {
    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Header title={title} description={description} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 gradient-bg">
                <div className="mx-auto w-full max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
