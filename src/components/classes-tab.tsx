"use client";

import React, { useState, useMemo } from 'react';
import type { ClassEntry, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { AddClassForm } from './add-class-form';
import { EditClassForm } from './edit-class-form';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClassesManager() {
  const [data, setData] = useState<ClassEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  const handleAddEntry = (newEntry: Omit<ClassEntry, 'id'>) => {
    const entryToAdd: ClassEntry = {
        ...newEntry,
        id: `c${Date.now()}`,
    };
    setData(prev => [entryToAdd, ...prev]);
  };

  const handleEditEntry = (updatedEntry: ClassEntry) => {
    setData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item));
  };
  
  const handleDeleteEntry = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => item.dayOfWeek === selectedDay);
  }, [data, selectedDay]);

  const groupedData = useMemo(() => {
    return filteredData.reduce((acc, entry) => {
      const teacher = entry.teacherName;
      if (!acc[teacher]) {
        acc[teacher] = [];
      }
      acc[teacher].push(entry);
      return acc;
    }, {} as Record<string, ClassEntry[]>);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-card z-10 py-4">
        <div className="flex-grow">
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
        </div>
        <div className="shrink-0">
          <AddClassForm onAddEntry={handleAddEntry} />
        </div>
      </div>
        
      <div className="space-y-6">
        {Object.entries(groupedData).length > 0 ? (
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
                                <TableCell className="font-medium">{item.level}</TableCell>
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
