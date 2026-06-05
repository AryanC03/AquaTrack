
"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { ClassAssessment, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isBefore, subWeeks, format, parse, set, startOfHour, startOfMinute } from 'date-fns';
import { updateClassAssessment, addAssessmentHistory, getAssessmentsForDay } from '@/lib/dataService';
import { Skeleton } from '../ui/skeleton';
import { AlertTriangle, Check, Clock, ChevronDown } from 'lucide-react';
import { useAssessors } from '@/context/assessor-context';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { LevelIcon } from '../level-icon';
import { useSettings } from '@/context/settings-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


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

const getOverdueThresholdForDay = (settings: any, day: DayOfWeek) => {
    return settings.dailyOverdueWeeks?.[day] ?? settings.overdueWeeks ?? 4;
};

export function OverdueSchedule() {
    const [overdueAssessments, setOverdueAssessments] = useState<ClassAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { assessors } = useAssessors();
    const { settings } = useSettings();
    const { toast } = useToast();
    const [localAssessors, setLocalAssessors] = useState<Record<string, string>>({});
    const [currentDay, setCurrentDay] = useState<DayOfWeek>('Monday');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState<Record<string, string>>({});

    const isDue = (assessment: ClassAssessment) => {
        if (assessment.manualStatus === 'Completed') return false; 
        if (assessment.manualStatus === 'Overdue') return true;
        if (!assessment.assessmentDate) return true; 
        return isBefore(assessment.assessmentDate.toDate(), subWeeks(new Date(), settings.overdueWeeks));
    }

    const fetchAssessments = useCallback(async (day: DayOfWeek) => {
        setIsLoading(true);
        try {
            const thresholdWeeks = getOverdueThresholdForDay(settings, day);
            const allAssessments = await getAssessmentsForDay(day);
            const overdue = allAssessments.filter((assessment) => {
                if (assessment.manualStatus === 'Completed') return false;
                if (assessment.manualStatus === 'Overdue') return true;
                if (!assessment.assessmentDate) return true;
                return isBefore(assessment.assessmentDate.toDate(), subWeeks(new Date(), thresholdWeeks));
            });
            setOverdueAssessments(overdue);
        } catch (error) {
            console.error("Error fetching assessments: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [settings.dailyOverdueWeeks, settings.overdueWeeks]);

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
                 
                 let closestSlot: string | undefined;
                 let closestDiff = Number.POSITIVE_INFINITY;
                 timeSlots.forEach(slot => {
                     const slotDate = timeStringToDate(slot);
                     const diff = Math.abs(slotDate.getTime() - assessmentDate.getTime());
                     if (diff < closestDiff) {
                         closestDiff = diff;
                         closestSlot = slot;
                     }
                 });

                 if (closestSlot && grid[assessment.teacherName][closestSlot]) {
                    grid[assessment.teacherName][closestSlot].push(assessment);
                 }
            }
        });
        return grid;
    }, [overdueAssessments, teachers, timeSlots]);

    const handleCompletion = async (assessment: ClassAssessment, assessor: string) => {
        if (!assessor || assessor.trim() === '') {
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
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle />
                    Today's Overdue Assessments
                </CardTitle>
                 <CardDescription>A schedule view of all assessments that require immediate attention today.</CardDescription>
            </CardHeader>
            <CardContent className="h-full p-0 flex flex-col overflow-hidden">
                <ScrollArea className="h-full overflow-x-auto">
                    <div className="grid gap-0 bg-border min-w-full" style={{ gridTemplateColumns: `minmax(95px, 1fr) repeat(${timeSlots.length}, minmax(160px, 1fr))` }}>
                        {/* Header Row */}
                        <div className="px-2 py-1 bg-card font-semibold sticky left-0 z-10 text-xs">Teacher</div>
                        {timeSlots.map(slot => (
                            <div key={slot} className="px-1 py-0.5 bg-card font-semibold flex items-center gap-0.5 text-xs">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="truncate">{slot}</span>
                            </div>
                        ))}
                        
                        {/* Data Rows */}
                        {teachers.map(teacher => (
                            <React.Fragment key={teacher}>
                                <div className="px-2 py-1 bg-card font-semibold sticky left-0 z-10 text-xs truncate">{teacher}</div>
                                {timeSlots.map(slot => {
                                    const assessmentsInSlot = scheduleGrid[teacher]?.[slot] || [];
                                    return (
                                        <div key={`${teacher}-${slot}`} className={cn("p-0.5 bg-card min-h-[28px]", assessmentsInSlot.length > 0 && "bg-destructive/10")}>
                                            {assessmentsInSlot.map(assessment => (
                                                <div key={assessment.id} className="space-y-1 mb-1 p-1 rounded border border-destructive/20 bg-card">
                                                    <div className="flex items-center gap-0.5 font-semibold text-xs">
                                                        <LevelIcon levelName={assessment.level} className="h-3 w-3"/>
                                                        <span className="truncate">{assessment.level}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <Popover open={openDropdown === assessment.id} onOpenChange={(open) => {
                                                            setOpenDropdown(open ? assessment.id : null);
                                                            if (!open) setSearchInput(prev => ({...prev, [assessment.id]: ''}));
                                                        }}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="h-5 text-xs py-0 px-1 w-full justify-between">
                                                                    <span className="truncate">{localAssessors[assessment.id] || 'ASO'}</span>
                                                                    <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-32 p-0">
                                                                <div className="p-1 space-y-1">
                                                                    <Input
                                                                        placeholder="Search..."
                                                                        value={searchInput[assessment.id] || ''}
                                                                        onChange={(e) => setSearchInput(prev => ({...prev, [assessment.id]: e.target.value}))}
                                                                        className="h-6 text-xs px-2"
                                                                        autoFocus
                                                                    />
                                                                    <div className="space-y-0.5 max-h-32 overflow-y-auto">
                                                                        {assessors
                                                                            .filter(a => a.toLowerCase().includes((searchInput[assessment.id] || '').toLowerCase()))
                                                                            .map(a => (
                                                                                <Button
                                                                                    key={a}
                                                                                    variant={localAssessors[assessment.id] === a ? 'default' : 'ghost'}
                                                                                    className="h-5 text-xs w-full justify-start px-1"
                                                                                    onClick={() => {
                                                                                        setLocalAssessors(prev => ({...prev, [assessment.id]: a}));
                                                                                        setOpenDropdown(null);
                                                                                    }}
                                                                                >
                                                                                    {a}
                                                                                </Button>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Button 
                                                            size="sm"
                                                            className="h-5 text-xs py-0 px-1"
                                                            onClick={() => handleCompletion(assessment, localAssessors[assessment.id])}
                                                        >
                                                            <Check className="h-2.5 w-2.5"/>
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

    
