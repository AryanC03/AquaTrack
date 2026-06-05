
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, writeBatch, Timestamp, doc } from 'firebase/firestore';
import type { ClassEntry, DayOfWeek, ClassAssessment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { AddClassForm } from './add-class-form';
import { EditClassForm } from './edit-class-form';
import { updateClass, deleteClass } from '@/lib/dataService';
import { Skeleton } from './ui/skeleton';
import { useAssessors } from '@/context/assessor-context';
import { ImportClassesButton } from './import-classes-button';
import { LevelIcon } from './level-icon';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to convert time strings (e.g., "9:00 AM" or "14:00") to a sortable format
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
    } else if (!isPM && !isAM && hours < 24) {
        // 24hr format, no change needed.
    }

    return hours * 60 + minutes;
};

export function ClassesManager() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [searchTerm, setSearchTerm] = useState('');
  const { assessors } = useAssessors();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'classes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassEntry));
      setData(classesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEntry = async (newEntry: Omit<ClassEntry, 'id'>) => {
    try {
        const batch = writeBatch(db);
        
        // Add the new class
        const classDocRef = doc(collection(db, 'classes'));
        batch.set(classDocRef, newEntry);

        // Create a corresponding assessment
        const assessmentDocRef = doc(collection(db, 'assessments'));
        const newAssessment: Omit<ClassAssessment, 'id'> = {
            classId: classDocRef.id, // Link the assessment to the class
            teacherName: newEntry.teacherName,
            classTime: newEntry.classTime,
            level: newEntry.level,
            dayOfWeek: newEntry.dayOfWeek,
            assessmentDate: Timestamp.now(),
            assessorInitials: '', // Start with blank assessor
            manualStatus: 'Normal',
        };
        batch.set(assessmentDocRef, newAssessment);

        await batch.commit();

    } catch (error) {
        console.error("Error adding class and assessment: ", error);
    }
  };

  const handleEditEntry = async (updatedEntry: ClassEntry) => {
    try {
        await updateClass(updatedEntry.id, updatedEntry);
    } catch (error) {
        console.error("Error updating class: ", error);
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    try {
        await deleteClass(id);
        // Note: Corresponding assessment is not deleted automatically.
        // This would require a more complex backend setup (e.g., Cloud Functions)
        // or finding and deleting it here, which can be complex if class details change.
    } catch (error) {
        console.error("Error deleting class: ", error);
    }
  };

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return data.filter(item => {
      const matchesDay = item.dayOfWeek === selectedDay;
      const matchesSearch = normalizedSearch
        ? item.teacherName.toLowerCase().includes(normalizedSearch)
        : true;
      return matchesDay && matchesSearch;
    });
  }, [data, selectedDay, searchTerm]);

  const groupedData = useMemo(() => {
    const grouped = filteredData.reduce((acc, entry) => {
      const teacher = entry.teacherName;
      if (!acc[teacher]) {
        acc[teacher] = [];
      }
      acc[teacher].push(entry);
      return acc;
    }, {} as Record<string, ClassEntry[]>);

    // Sort classes within each group by class time
    for (const teacher in grouped) {
      grouped[teacher].sort((a, b) => timeStringToMinutes(a.classTime) - timeStringToMinutes(b.classTime));
    }

    return grouped;
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 sticky top-0 bg-card z-10 py-4 -mt-6 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
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
          <div className="shrink-0 flex items-center gap-2">
            <ImportClassesButton />
            <AddClassForm onAddEntry={handleAddEntry} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teachers..."
            className="min-w-[240px]"
          />
          <div className="text-sm text-muted-foreground">
            {searchTerm ? `Filtering teachers by "${searchTerm}"` : 'Search by teacher name'}
          </div>
        </div>
      </div>
        
      <div className="space-y-6">
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : Object.entries(groupedData).length > 0 ? (
          Object.entries(groupedData).map(([teacherName, teacherClasses]) => (
            <Card key={teacherName} className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl">{teacherName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Level</TableHead>
                            <TableHead>Class Time</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {teacherClasses.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <LevelIcon levelName={item.level} />
                                        {item.level}
                                    </div>
                                </TableCell>
                                <TableCell>{item.classTime}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <EditClassForm entry={item} onEditEntry={handleEditEntry} />
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
                                                        This action cannot be undone. This will permanently remove the class at {item.classTime} for {item.teacherName}.
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
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
          ))
        ) : (
             <p className="text-center text-muted-foreground py-8">No classes scheduled for {selectedDay}.</p>
        )}
      </div>
    </div>
  );
}
