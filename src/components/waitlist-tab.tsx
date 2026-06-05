
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { ClassDemandEntry, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AddClassDemandEntryForm } from './add-waitlist-entry-form';
import { EditClassDemandEntryForm } from './edit-waitlist-entry-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { addClassDemandEntry, updateClassDemandEntry, deleteClassDemandEntry } from '@/lib/dataService';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { AppLayout } from './dashboard/app-layout';
import { LevelIcon } from './level-icon';

type SortKey = 'dateAdded' | 'preferredTime';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CompactTableCell = ({ className, ...props }: React.ComponentProps<typeof TableCell>) => (
    <TableCell className={cn("p-2", className)} {...props} />
);

const CompactTableHead = ({ className, ...props }: React.ComponentProps<typeof TableHead>) => (
    <TableHead className={cn("p-2", className)} {...props} />
);

function ClassDemandContent() {
  const [data, setData] = useState<ClassDemandEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');


  useEffect(() => {
    const todayIndex = new Date().getDay();
    const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = weekMap[todayIndex];
    setSelectedDay(todayName === 'Sunday' ? 'Monday' : todayName);

    setIsLoading(true);
    const q = query(collection(db, 'classDemand'), orderBy(sortKey, sortOrder));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const demandData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassDemandEntry));
      setData(demandData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [sortKey, sortOrder]);


  const handleAddEntry = async (newEntry: Omit<ClassDemandEntry, 'id' | 'dateAdded' | 'dayOfWeek'>) => {
    try {
        await addClassDemandEntry({ 
          ...newEntry, 
          dayOfWeek: selectedDay 
        });
    } catch (error) {
        console.error("Error adding class demand entry: ", error);
    }
  };

  const handleEditEntry = async (updatedEntry: ClassDemandEntry) => {
    try {
        await updateClassDemandEntry(updatedEntry.id, updatedEntry);
    } catch (error) {
        console.error("Error updating class demand entry: ", error);
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    try {
        await deleteClassDemandEntry(id);
    } catch (error) {
        console.error("Error deleting class demand entry: ", error);
    }
  };
  
  const filteredData = useMemo(() => {
    return data.filter(item => item.dayOfWeek === selectedDay);
  }, [data, selectedDay]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Class Demand</CardTitle>
             <AddClassDemandEntryForm onAddEntry={handleAddEntry} />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="dateAdded">Most Recent</SelectItem>
                    <SelectItem value="preferredTime">Preferred Time</SelectItem>
                </SelectContent>
            </Select>
             <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                 <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
            </Select>
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
                <CompactTableHead>Student</CompactTableHead>
                <CompactTableHead>Level</CompactTableHead>
                <CompactTableHead>Preferred Time</CompactTableHead>
                <CompactTableHead>Date Added</CompactTableHead>
                <CompactTableHead>ASO</CompactTableHead>
                <CompactTableHead>Notes</CompactTableHead>
                <CompactTableHead className="text-right">Actions</CompactTableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                  <TableRow>
                    <CompactTableCell colSpan={7}>
                      <Skeleton className="h-20 w-full" />
                    </CompactTableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? filteredData.map(item => (
                <TableRow key={item.id}>
                    <CompactTableCell className="font-medium">{item.studentName}</CompactTableCell>
                    <CompactTableCell>
                        <div className="flex items-center gap-2">
                            <LevelIcon levelName={item.classLevel} />
                            {item.classLevel}
                        </div>
                    </CompactTableCell>
                    <CompactTableCell>{item.preferredTime}</CompactTableCell>
                    <CompactTableCell>{item.dateAdded ? format(item.dateAdded.toDate(), 'dd/MM/yy') : 'N/A'}</CompactTableCell>
                    <CompactTableCell>{item.asoInitials}</CompactTableCell>
                    <CompactTableCell className="max-w-[200px] truncate">{item.notes || 'N/A'}</CompactTableCell>
                    <CompactTableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                            <EditClassDemandEntryForm entry={item} onEditEntry={handleEditEntry} />
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
                                            This action cannot be undone. This will permanently remove {item.studentName} from the class demand list.
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
                        <CompactTableCell colSpan={7} className="text-center h-24">
                           No class demand entries for {selectedDay}.
                        </CompactTableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClassDemandPage() {
    return (
        <AppLayout
            title="Class Demand"
            description="Manage prospective students waiting for a class."
        >
            <ClassDemandContent />
        </AppLayout>
    )
}
