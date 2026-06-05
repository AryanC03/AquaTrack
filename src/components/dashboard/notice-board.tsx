
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssessors } from '@/context/assessor-context';
import type { Notice, DayOfWeek } from '@/lib/types';
import { addNotice, getNoticesForDay, deleteNotice } from '@/lib/dataService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { Plus, NotebookPen, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function NoticeBoard() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newNoteText, setNewNoteText] = useState('');
    const [selectedAso, setSelectedAso] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { assessors, isLoading: isLoadingAssessors } = useAssessors();
    const { toast } = useToast();
    const [selectedDay, setSelectedDay] = useState<DayOfWeek | undefined>(undefined);

    useEffect(() => {
        const todayIndex = new Date().getDay();
        const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = weekMap[todayIndex];
        setSelectedDay(todayName);
    }, []);

    const fetchNotices = useCallback(async (day: DayOfWeek) => {
        setIsLoading(true);
        try {
            const fetchedNotices = await getNoticesForDay(day);
            setNotices(fetchedNotices);
        } catch (error) {
            console.error(`Failed to fetch notices for ${day}:`, error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch notices.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (selectedDay) {
            fetchNotices(selectedDay);
        }
    }, [selectedDay, fetchNotices]);

    const handleAddNotice = async () => {
        if (!newNoteText.trim() || !selectedAso) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please write a note and select your initials.' });
            return;
        }
        if (!selectedDay) return;

        setIsSubmitting(true);
        try {
            await addNotice({
                dayOfWeek: selectedDay,
                noteText: newNoteText,
                asoInitials: selectedAso,
            });
            toast({ title: 'Notice Added', description: 'Your note has been posted.' });
            setNewNoteText('');
            // No need to reset ASO, user likely to post more
            fetchNotices(selectedDay); // Refresh notices for the current day
        } catch (error) {
            console.error("Failed to add notice:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not post the notice.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteNotice = async (id: string) => {
        if (!selectedDay) return;
        try {
            await deleteNotice(id);
            toast({ title: "Notice Deleted", description: "The notice has been removed." });
            fetchNotices(selectedDay); // Refresh notices
        } catch (error) {
            console.error("Failed to delete notice:", error);
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not remove the notice.' });
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <NotebookPen />
                    Notice Board
                </CardTitle>
                <CardDescription>Daily notices for the team. AI summaries provide a quick overview.</CardDescription>
                 <div className="flex flex-wrap gap-2 pt-4">
                    {daysOfWeek.map(day => (
                        <Button
                        key={day}
                        variant={selectedDay === day ? 'default' : 'outline'}
                        onClick={() => setSelectedDay(day)}
                        >
                        {day}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                <div className="space-y-3 flex-grow">
                    {isLoading || !selectedDay ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : notices.length > 0 ? (
                        notices.map(notice => (
                            <div key={notice.id} className="text-sm p-3 border rounded-md bg-muted/50 relative group">
                                <p className="font-semibold pr-8">{notice.summary}</p>
                                <p className="text-muted-foreground text-xs pt-1 pr-8">{notice.noteText}</p>
                                <p className="text-xs text-muted-foreground/80 mt-2">
                                    - {notice.asoInitials}, {format(notice.dateAdded.toDate(), 'dd/MM/yy HH:mm')}
                                </p>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100">
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">Delete notice</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this notice. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteNotice(notice.id)}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No notices for {selectedDay}.
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-3 pt-4 border-t">
                    <Textarea
                        placeholder={selectedDay ? `Add a new notice for ${selectedDay}...` : 'Select a day to add a notice...'}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        disabled={isSubmitting || !selectedDay}
                    />
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedAso}
                            onValueChange={setSelectedAso}
                            disabled={isLoadingAssessors || isSubmitting}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select your initials" />
                            </SelectTrigger>
                            <SelectContent>
                                {assessors.map(initials => (
                                    <SelectItem key={initials} value={initials}>{initials}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddNotice} disabled={isSubmitting || !selectedDay}>
                            <Plus className="mr-2 h-4 w-4" />
                            {isSubmitting ? "Adding..." : "Add Note"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
