
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { AssessmentHistoryEntry, ClassNote } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ListTodo, NotebookPen, Plus, X } from 'lucide-react';
import { LevelIcon } from './level-icon';
import { deleteAssessmentHistory, addClassNote, deleteClassNote } from '@/lib/dataService';
import { useToast } from '@/hooks/use-toast';
import { useAssessors } from '@/context/assessor-context';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ClassDetailsDialogProps {
  assessment: { classId: string, level: string, teacherName: string, classTime: string } | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const noteFormSchema = z.object({
  noteText: z.string().min(1, 'Note content cannot be empty.'),
  asoInitials: z.string().min(1, 'Please select your initials.'),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

export function ClassDetailsDialog({ assessment, isOpen, onOpenChange }: ClassDetailsDialogProps) {
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>([]);
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const { toast } = useToast();
  const { assessors, isLoading: isLoadingAssessors } = useAssessors();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { noteText: '', asoInitials: '' },
  });

  useEffect(() => {
    if (!isOpen || !assessment) {
      setHistory([]);
      setNotes([]);
      return;
    }

    // Fetch Assessment History
    if (assessment.classId) {
        setIsLoadingHistory(true);
        const historyQuery = query(
          collection(db, 'assessmentHistory'),
          where('classId', '==', assessment.classId)
        );

        const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
          const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssessmentHistoryEntry));
          // Sort client-side to avoid composite index
          const sortedHistory = historyData.sort((a, b) => b.assessmentDate.toDate().getTime() - a.assessmentDate.toDate().getTime());
          setHistory(sortedHistory);
          setIsLoadingHistory(false);
        }, (err) => {
          console.error("Error fetching assessment history:", err);
          setIsLoadingHistory(false);
        });
        
        // Fetch Class Notes
        setIsLoadingNotes(true);
        const notesQuery = query(
          collection(db, 'classNotes'),
          where('classId', '==', assessment.classId),
          orderBy('dateAdded', 'desc')
        );

        const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
          const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassNote));
          setNotes(notesData);
          setIsLoadingNotes(false);
        }, (err) => {
          console.error("Error fetching class notes:", err);
          setIsLoadingNotes(false);
        });
        
        return () => {
            unsubscribeHistory();
            unsubscribeNotes();
        };
    }
  }, [isOpen, assessment]);

  const handleDeleteHistory = async (historyId: string) => {
      try {
          await deleteAssessmentHistory(historyId);
          toast({ title: "History Deleted", description: "The assessment record has been removed." });
      } catch (error) {
          console.error("Error deleting history entry: ", error);
          toast({ variant: 'destructive', title: "Delete Failed", description: "Could not remove the history record." });
      }
  };

  const handleDeleteNote = async (noteId: string) => {
      try {
          await deleteClassNote(noteId);
          toast({ title: "Note Deleted", description: "The note has been removed." });
      } catch (error) {
          console.error("Error deleting note: ", error);
          toast({ variant: 'destructive', title: "Delete Failed", description: "Could not remove the note." });
      }
  };

  const handleAddNote = async (data: NoteFormValues) => {
    if (!assessment) return;
    try {
        await addClassNote({
            classId: assessment.classId,
            noteText: data.noteText,
            asoInitials: data.asoInitials,
        });
        toast({ title: "Note Added", description: "Your note has been saved."});
        form.reset();
    } catch(error) {
        console.error("Error adding note: ", error);
        toast({ variant: 'destructive', title: "Save Failed", description: "Could not save the note." });
    }
  }


  const dialogTitle = useMemo(() => {
    if (!assessment) return "Class Details";
    return (
        <div className="flex items-center gap-3">
            <LevelIcon levelName={assessment.level} className="h-6 w-6" />
            <span>{assessment.level} - {assessment.teacherName} ({assessment.classTime})</span>
        </div>
    );
  }, [assessment]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Viewing class notes and assessment history for this class.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto space-y-6 pr-4 -mr-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <NotebookPen />
                       Class Notes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddNote)} className="space-y-3 p-4 border rounded-lg">
                           <FormField
                                control={form.control}
                                name="noteText"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Note</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add a note for this class..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="flex items-end gap-2">
                                <FormField
                                    control={form.control}
                                    name="asoInitials"
                                    render={({ field }) => (
                                        <FormItem className="w-32">
                                            <FormLabel>Your Initials</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger disabled={isLoadingAssessors}>
                                                        <SelectValue placeholder="ASO" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {assessors.map(initials => (
                                                        <SelectItem key={initials} value={initials}>{initials}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Add Note
                                </Button>
                             </div>
                        </form>
                    </Form>

                    <div className="space-y-3">
                         {isLoadingNotes ? (
                             <Skeleton className="h-16 w-full" />
                         ) : notes.length > 0 ? (
                            notes.map(note => (
                                <div key={note.id} className="text-sm p-3 border rounded-md bg-muted/50 relative group">
                                    <p className="pr-8">{note.noteText}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        - {note.asoInitials}, {format(note.dateAdded.toDate(), 'dd/MM/yy HH:mm')}
                                    </p>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100">
                                                <X className="h-3 w-3" />
                                                <span className="sr-only">Delete note</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete this note. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteNote(note.id)}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))
                         ) : (
                            <p className="text-center text-muted-foreground py-4">No notes for this class yet.</p>
                         )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListTodo />
                      Assessment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Assessor</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {isLoadingHistory ? (
                                <TableRow>
                                    <TableCell colSpan={3}>
                                        <Skeleton className="h-20 w-full" />
                                    </TableCell>
                                </TableRow>
                            ) : history.length > 0 ? history.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.assessmentDate ? format(item.assessmentDate.toDate(), 'dd/MM/yy') : 'N/A'}</TableCell>
                                    <TableCell>{item.assessorInitials || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the assessment record from {item.assessmentDate ? format(item.assessmentDate.toDate(), 'dd/MM/yy') : 'N/A'}. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteHistory(item.id)}>
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                    No assessment history found for this class.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
