
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import type { MissedAssessment, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { AddMissedAssessmentForm } from './add-missed-assessment-form';
import { useAssessors } from '@/context/assessor-context';
import { addMissedAssessment, deleteMissedAssessment, updateMissedAssessment } from '@/lib/dataService';
import { Skeleton } from './ui/skeleton';
import { getDateForDayOfWeek } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AppLayout } from './dashboard/app-layout';
import { LevelIcon } from './level-icon';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CompactTableCell = ({ className, ...props }: React.ComponentProps<typeof TableCell>) => (
    <TableCell className={cn("p-2", className)} {...props} />
);

const CompactTableHead = ({ className, ...props }: React.ComponentProps<typeof TableHead>) => (
    <TableHead className={cn("p-2", className)} {...props} />
);

function MissedAssessmentsContent() {
  const [data, setData] = useState<MissedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [sortKey, setSortKey] = useState<'assessmentDate' | 'teacherName' | 'studentName'>('assessmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { assessors } = useAssessors();

  useEffect(() => {
    const todayIndex = new Date().getDay();
    const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = weekMap[todayIndex];
    setSelectedDay(todayName === 'Sunday' ? 'Monday' : todayName);

    setIsLoading(true);
    const q = query(collection(db, 'missedAssessments'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const missedData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MissedAssessment));
      setData(missedData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEntry = async (newEntry: Omit<MissedAssessment, 'id' | 'assessmentDate' | 'dayOfWeek'>, dayOfWeek: DayOfWeek) => {
    try {
      const assessmentDate = getDateForDayOfWeek(dayOfWeek);
      await addMissedAssessment({
        ...newEntry,
        dayOfWeek,
        assessmentDate,
      });
    } catch (error) {
      console.error("Error adding missed assessment: ", error);
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteMissedAssessment(id);
    } catch (error) {
      console.error("Error deleting missed assessment: ", error);
    }
  };

  const handleAssessorChange = async (id: string, newAssessor: string) => {
    try {
        await updateMissedAssessment(id, { assessorInitials: newAssessor });
    } catch (error) {
        console.error("Error updating assessor: ", error);
    }
  };

  const filteredData = useMemo(() => {
    let result = data.filter(item => item.dayOfWeek === selectedDay);

    if (searchTerm) {
      result = result.filter(item =>
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return result;
  }, [data, searchTerm, selectedDay]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
        if (!a[sortKey] || !b[sortKey]) return 0;
        
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA.toDate && valB.toDate) {
            return sortOrder === 'asc' 
                ? valA.toDate().getTime() - valB.toDate().getTime() 
                : valB.toDate().getTime() - valA.toDate().getTime();
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Missed Assessments</CardTitle>
          <AddMissedAssessmentForm onAddEntry={handleAddEntry} initialDay={selectedDay} />
        </div>
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <Input
            placeholder="Search by student or teacher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:max-w-sm"
          />
           <div className="flex gap-2">
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as any)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="assessmentDate">Date</SelectItem>
                    <SelectItem value="teacherName">Teacher</SelectItem>
                    <SelectItem value="studentName">Student</SelectItem>
                </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                 <SelectTrigger className="w-full md:w-[120px]">
                    <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
            </Select>
           </div>
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
                <CompactTableHead>Teacher</CompactTableHead>
                <CompactTableHead>Class</CompactTableHead>
                <CompactTableHead>Date</CompactTableHead>
                <CompactTableHead>Assessor</CompactTableHead>
                <CompactTableHead className="text-right">Actions</CompactTableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                  <TableRow>
                    <CompactTableCell colSpan={6}>
                      <Skeleton className="h-20 w-full" />
                    </CompactTableCell>
                  </TableRow>
                ) : sortedData.length > 0 ? sortedData.map(item => (
                <TableRow key={item.id}>
                    <CompactTableCell>{item.studentName}</CompactTableCell>
                    <CompactTableCell>{item.teacherName}</CompactTableCell>
                    <CompactTableCell>
                         <div className="flex items-center gap-2">
                            <LevelIcon levelName={item.level} />
                           <span>{item.level} - {item.classTime}</span>
                        </div>
                    </CompactTableCell>
                    <CompactTableCell>{item.assessmentDate ? format(item.assessmentDate.toDate(), 'dd/MM/yy') : 'N/A'}</CompactTableCell>
                    <CompactTableCell>
                      <Select
                        value={item.assessorInitials}
                        onValueChange={(value) => handleAssessorChange(item.id, value)}
                        disabled={assessors.length === 0}
                      >
                        <SelectTrigger className="w-[80px] h-8 text-xs px-2">
                          <SelectValue placeholder="N/A" />
                        </SelectTrigger>
                        <SelectContent>
                          {assessors.map(assessor => (
                            <SelectItem key={assessor} value={assessor}>{assessor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactTableCell>
                    <CompactTableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
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
                                            This action cannot be undone. This will permanently remove the missed assessment for {item.studentName}.
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
                        <CompactTableCell colSpan={6} className="text-center h-24">
                            No missed assessments found for {selectedDay}.
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

export default function MissedAssessmentsPage() {
    return (
        <AppLayout
            title="Missed Assessments"
            description="Log and track students who have missed their assessments."
        >
            <MissedAssessmentsContent />
        </AppLayout>
    )
}
