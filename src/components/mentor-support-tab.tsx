
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { MentorSupportEntry, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Sparkles, X } from 'lucide-react';
import { AddMentorSupportForm } from './add-mentor-support-form';
import { EditMentorSupportForm } from './edit-mentor-support-form';
import { addMentorSupportEntry, updateMentorSupportEntry, deleteMentorSupportEntry } from '@/lib/dataService';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { MentorSupportDetailsDialog } from './mentor-support-details-dialog';
import { AppLayout } from './dashboard/app-layout';
import { LevelIcon } from './level-icon';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CompactTableCell = ({ className, ...props }: React.ComponentProps<typeof TableCell>) => (
    <TableCell className={cn("p-2", className)} {...props} />
);

const CompactTableHead = ({ className, ...props }: React.ComponentProps<typeof TableHead>) => (
    <TableHead className={cn("p-2", className)} {...props} />
);

function MentorSupportContent() {
  const [data, setData] = useState<MentorSupportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedRequest, setSelectedRequest] = useState<MentorSupportEntry | null>(null);

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = weekMap[todayIndex] || 'Monday';
    setSelectedDay(todayName);

    setIsLoading(true);
    const q = query(collection(db, 'mentorSupport'), orderBy('dateRequested', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const supportData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MentorSupportEntry));
      setData(supportData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEntry = async (newEntry: Omit<MentorSupportEntry, 'id' | 'dateRequested'>) => {
    try {
      await addMentorSupportEntry({
        ...newEntry,
        dayOfWeek: selectedDay,
      });
    } catch (error) {
      console.error("Error adding mentor support entry: ", error);
    }
  };

  const handleEditEntry = async (updatedEntry: MentorSupportEntry) => {
    try {
        await updateMentorSupportEntry(updatedEntry.id, updatedEntry);
    } catch (error) {
        console.error("Error updating mentor support entry: ", error);
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    try {
        await deleteMentorSupportEntry(id);
    } catch (error) {
        console.error("Error deleting mentor support entry: ", error);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => item.dayOfWeek === selectedDay);
  }, [data, selectedDay]);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Mentor Support Requests</CardTitle>
          <AddMentorSupportForm onAddEntry={handleAddEntry} initialDay={selectedDay} />
        </div>
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
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <CompactTableHead>Teacher</CompactTableHead>
                <CompactTableHead>Class</CompactTableHead>
                <CompactTableHead>Reason</CompactTableHead>
                <CompactTableHead>Date</CompactTableHead>
                <CompactTableHead className="text-right">Actions</CompactTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                    <CompactTableCell colSpan={5}>
                      <Skeleton className="h-20 w-full" />
                    </CompactTableCell>
                  </TableRow>
              ) : filteredData.length > 0 ? filteredData.map(item => (
                <TableRow key={item.id}>
                  <CompactTableCell className="font-medium">{item.teacherName}</CompactTableCell>
                  <CompactTableCell>
                      <div className="flex items-center gap-2">
                        <LevelIcon levelName={item.level} />
                        <span>{item.level} - {item.classTime}</span>
                      </div>
                  </CompactTableCell>
                  <CompactTableCell className="max-w-[300px] truncate">{item.reason}</CompactTableCell>
                  <CompactTableCell>{item.dateRequested ? format(item.dateRequested.toDate(), 'dd/MM/yy') : 'N/A'}</CompactTableCell>
                   <CompactTableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(item)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get AI Help
                            </Button>
                           <EditMentorSupportForm entry={item} onEditEntry={handleEditEntry} />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently remove the support request for {item.teacherName}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteEntry(item.id)}>
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CompactTableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <CompactTableCell colSpan={5} className="text-center h-24">
                    No mentor support requests found for {selectedDay}.
                  </CompactTableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    <MentorSupportDetailsDialog 
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedRequest(null);
            }
        }}
    />
    </>
  );
}

export default function MentorSupportPage() {
    return (
        <AppLayout
            title="Mentor Support"
            description="Provide AI-powered coaching and guidance to instructors."
        >
            <MentorSupportContent />
        </AppLayout>
    )
}
