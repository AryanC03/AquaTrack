
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAssessmentsForDay } from '@/lib/dataService';
import type { ClassAssessment, DayOfWeek } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { ListChecks } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { LevelIcon } from '../level-icon';

// Helper to convert time strings (e.g., "9:00 AM") to a sortable format
const timeStringToMinutes = (timeStr: string) => {
    if (!timeStr) return 9999;
    
    const upperTimeStr = timeStr.toUpperCase();
    const isPM = upperTimeStr.includes('PM');
    const isAM = upperTimeStr.includes('AM');

    let timeOnly = upperTimeStr.replace('AM', '').replace('PM', '').trim();
    const parts = timeOnly.split(':');

    if (parts.length < 1) return 9999; // Invalid format

    let hours = parseInt(parts[0], 10);
    const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isNaN(hours) || isNaN(minutes)) return 9999;

    if (isPM && hours !== 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0; // Midnight case
    }

    return hours * 60 + minutes;
};


export function DailyAssessmentsDue() {
    const [assessments, setAssessments] = useState<ClassAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            setIsLoading(true);
            try {
                const todayIndex = new Date().getDay();
                const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const todayName = weekMap[todayIndex];

                if (todayName) {
                    const fetchedAssessments = await getAssessmentsForDay(todayName);
                    const sortedAssessments = fetchedAssessments.sort((a, b) => 
                        timeStringToMinutes(a.classTime) - timeStringToMinutes(b.classTime)
                    );
                    setAssessments(sortedAssessments);
                }
            } catch (error) {
                console.error("Failed to fetch today's assessments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListChecks />
                    Daily Assessments Due
                </CardTitle>
                <CardDescription>All classes scheduled for assessment today.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4">
                     {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : assessments.length > 0 ? (
                         <ul className="space-y-3">
                            {assessments.map(assessment => (
                                <li key={assessment.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                    <div className="flex items-center gap-3">
                                        <LevelIcon levelName={assessment.level} className="h-6 w-6"/>
                                        <div>
                                            <p className="font-semibold">{assessment.level}</p>
                                            <p className="text-sm text-muted-foreground">{assessment.teacherName}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium">{assessment.classTime}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No assessments scheduled for today.
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
