
"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { ClassAssessment, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isBefore, subWeeks, format, parse, set, startOfHour, startOfMinute } from 'date-fns';
import { updateClassAssessment, addAssessmentHistory, getAssessmentsForDay } from '@/lib/dataService';
import { Skeleton } from '../ui/skeleton';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { useAssessors } from '@/context/assessor-context';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { LevelIcon } from '../level-icon';
import { useSettings } from '@/context/settings-context';


const timeStringToDate = (timeStr: string): Date => {
    try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
        }
        if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }
        
        const date = new Date();
        date.setHours(hours, minutes || 0, 0, 0);
        return date;
    } catch {
        // Fallback for invalid time strings
        const date = new Date();
        date.setHours(23, 59, 0, 0);
        return date;
    }
};

const generateTimeSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number, interval: number): string[] => {
    const slots = [];
    const today = new Date();
    let current = set(today, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
    const end = set(today, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });
    
    while (current <= end) {
        slots.push(format(current, 'h:mm a'));
        current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
};

const getFixedTimeSlots = (dayOfWeek: DayOfWeek): string[] => {
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

    if (isWeekend) {
        const morningSlots = generateTimeSlots(8, 0, 11, 0, 30);
        const afternoonSlots = generateTimeSlots(11, 15, 12, 15, 30);
        return [...morningSlots, ...afternoonSlots];
    } else {
        // Weekdays
        return generateTimeSlots(16, 0, 19, 0, 30).slice(0, -1); // from 16:00 to 18:30
    }
}


const NOT_ASSIGNED_VALUE = "N/A_PLACEHOLDER";

export function OverdueSchedule() {
    const [overdueAssessments, setOverdueAssessments] = useState<ClassAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { assessors } = useAssessors();
    const { settings } = useSettings();
    const { toast } = useToast();
    const [localAssessors, setLocalAssessors] = useState<Record<string, string>>({});
    const [currentDay, setCurrentDay] = useState<DayOfWeek>('Monday');

    const isDue = (assessment: ClassAssessment) => {
        if (assessment.manualStatus === 'Completed') return false; 
        if (assessment.manualStatus === 'Overdue') return true;
        if (!assessment.assessmentDate) return true; 
        return isBefore(assessment.assessmentDate.toDate(), subWeeks(new Date(), settings.overdueWeeks));
    }

    const fetchAssessments = useCallback(async (day: DayOfWeek) => {
        setIsLoading(true);
        try {
            const allAssessments = await getAssessmentsForDay(day);
            const overdue = allAssessments.filter(assessment => isDue(assessment));
            setOverdueAssessments(overdue);
        } catch (error) {
            console.error("Error fetching assessments: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [settings.overdueWeeks]);

    useEffect(() => {
        const todayIndex = new Date().getDay();
        const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = weekMap[todayIndex];
        setCurrentDay(todayName);
        fetchAssessments(todayName);
    }, [fetchAssessments]);


    const timeSlots = useMemo(() => {
        return getFixedTimeSlots(currentDay);
    }, [currentDay]);

    const teachers = useMemo(() => {
        return Array.from(new Set(overdueAssessments.map(a => a.teacherName))).sort();
    }, [overdueAssessments]);

    const scheduleGrid = useMemo(() => {
        const grid: Record<string, Record<string, ClassAssessment[]>> = {};
        teachers.forEach(teacher => {
            grid[teacher] = {};
            timeSlots.forEach(slot => {
                grid[teacher][slot] = [];
            });
        });

        overdueAssessments.forEach(assessment => {
            if (grid[assessment.teacherName]) {
                 const assessmentDate = timeStringToDate(assessment.classTime);
                 
                 // Find the correct slot
                 const slotKey = format(assessmentDate, 'h:mm a');

                 // This logic finds the closest matching time slot if times are not exact
                 let matchingSlot = timeSlots.find(slot => {
                     const slotDate = timeStringToDate(slot);
                     return slotDate.getHours() === assessmentDate.getHours() && slotDate.getMinutes() === assessmentDate.getMinutes();
                 });

                 if (matchingSlot && grid[assessment.teacherName][matchingSlot]) {
                    grid[assessment.teacherName][matchingSlot].push(assessment);
                 }
            }
        });
        return grid;
    }, [overdueAssessments, teachers, timeSlots]);

    const handleCompletion = async (assessment: ClassAssessment, assessor: string) => {
        if (!assessor || assessor === NOT_ASSIGNED_VALUE) {
             toast({ variant: "destructive", title: "Assessor Required", description: "Please select an assessor before completing." });
             return;
        }
        try {
            const completionDate = new Date();
            await addAssessmentHistory({
                classId: assessment.classId,
                teacherName: assessment.teacherName,
                level: assessment.level,
                classTime: assessment.classTime,
                assessorInitials: assessor,
                assessmentDate: completionDate,
            });
            await updateClassAssessment(assessment.id, {
                manualStatus: 'Normal',
                assessmentDate: Timestamp.fromDate(completionDate),
                assessorInitials: assessor,
            });
            
            await fetchAssessments(currentDay);
            
            toast({ title: "Assessment Completed" });
        } catch (error) {
            console.error("Error completing assessment: ", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not complete assessment." });
        }
    };
    
    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (overdueAssessments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Check className="text-green-500"/>
                        All Caught Up!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">There are no overdue assessments for today.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle />
                    Today's Overdue Assessments
                </CardTitle>
                 <CardDescription>A schedule view of all assessments that require immediate attention today.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea>
                    <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `minmax(120px, 1fr) repeat(${timeSlots.length}, minmax(180px, 1fr))` }}>
                        {/* Header Row */}
                        <div className="p-2 bg-card font-semibold sticky left-0 z-10">Teacher</div>
                        {timeSlots.map(slot => (
                            <div key={slot} className="p-2 bg-card font-semibold flex items-center gap-1.5 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {slot}
                            </div>
                        ))}
                        
                        {/* Data Rows */}
                        {teachers.map(teacher => (
                            <React.Fragment key={teacher}>
                                <div className="p-2 bg-card font-semibold sticky left-0 z-10 text-sm">{teacher}</div>
                                {timeSlots.map(slot => {
                                    const assessmentsInSlot = scheduleGrid[teacher]?.[slot] || [];
                                    return (
                                        <div key={`${teacher}-${slot}`} className={cn("p-2 bg-card min-h-[100px]", assessmentsInSlot.length > 0 && "bg-destructive/10")}>
                                            {assessmentsInSlot.map(assessment => (
                                                <div key={assessment.id} className="space-y-2 mb-2 p-2 rounded border border-destructive/20 bg-card">
                                                    <div className="flex items-center gap-2 font-semibold text-xs">
                                                        <LevelIcon levelName={assessment.level} className="h-4 w-4"/>
                                                        {assessment.level}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Select
                                                            value={localAssessors[assessment.id] || NOT_ASSIGNED_VALUE}
                                                            onValueChange={(value) => setLocalAssessors(prev => ({...prev, [assessment.id]: value}))}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Select ASO" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={NOT_ASSIGNED_VALUE} disabled>Select ASO</SelectItem>
                                                                {assessors.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button 
                                                            size="sm"
                                                            className="h-8 text-xs"
                                                            onClick={() => handleCompletion(assessment, localAssessors[assessment.id])}
                                                        >
                                                            <Check className="h-3 w-3 mr-1.5"/>
                                                            Complete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

    
