
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { ClassAssessment, DayOfWeek, AssessmentStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isBefore, subWeeks, format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ClassesManager } from './classes-manager';
import { useAssessors } from '@/context/assessor-context';
import { updateClassAssessment, addAssessmentHistory } from '@/lib/dataService';
import { Skeleton } from './ui/skeleton';
import { AlertTriangle, Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassDetailsDialog } from './class-details-dialog';
import { AppLayout } from './dashboard/app-layout';
import { LevelIcon } from './level-icon';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NOT_ASSIGNED_VALUE = "N/A_PLACEHOLDER";

const timeStringToMinutes = (timeStr: string) => {
    if (!timeStr) return 9999;
    
    const upperTimeStr = timeStr.toUpperCase();
    const isPM = upperTimeStr.includes('PM');
    const isAM = upperTimeStr.includes('AM');

    let timeOnly = upperTimeStr.replace('AM', '').replace('PM', '').trim();
    const parts = timeOnly.split(':');

    if (parts.length < 1) return 9999;

    let hours = parseInt(parts[0], 10);
    const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isNaN(hours) || isNaN(minutes)) return 9999;

    if (isPM && hours !== 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    } else if (!isPM && !isAM && hours < 24) {}

    return hours * 60 + minutes;
};

const CompactTableCell = ({ className, ...props }: React.ComponentProps<typeof TableCell>) => (
    <TableCell className={cn("p-2", className)} {...props} />
);

const CompactTableHead = ({ className, ...props }: React.ComponentProps<typeof TableHead>) => (
    <TableHead className={cn("p-2", className)} {...props} />
);

function OverdueAssessmentsCard({ assessments, selectedDay, onComplete, overdueWeeks, assessors }: {
    assessments: ClassAssessment[],
    selectedDay: DayOfWeek,
    onComplete: (assessment: ClassAssessment, assessor: string) => void,
    overdueWeeks: number,
    assessors: string[]
}) {
    const [localAssessors, setLocalAssessors] = useState<Record<string, string>>({});

    const isDue = (assessment: ClassAssessment) => {
        if (assessment.manualStatus === 'Completed') return false; 
        if (assessment.manualStatus === 'Overdue') return true;
        if (!assessment.assessmentDate) return true; 
        return isBefore(assessment.assessmentDate.toDate(), subWeeks(new Date(), overdueWeeks));
    }

    const overdueAssessments = useMemo(() => {
        return assessments
            .filter(assessment => isDue(assessment) && assessment.dayOfWeek === selectedDay)
            .sort((a, b) => timeStringToMinutes(a.classTime) - timeStringToMinutes(b.classTime));
    }, [assessments, selectedDay, overdueWeeks]);

    if (overdueAssessments.length === 0) {
        return null;
    }

    const handleLocalAssessorChange = (assessmentId: string, assessor: string) => {
        setLocalAssessors(prev => ({...prev, [assessmentId]: assessor}));
    }

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle />
                    Overdue Assessments for {selectedDay}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <CompactTableHead>Time</CompactTableHead>
                                <CompactTableHead>Teacher</CompactTableHead>
                                <CompactTableHead>Level</CompactTableHead>
                                <CompactTableHead>Last Assessed</CompactTableHead>
                                <CompactTableHead>Assessor</CompactTableHead>
                                <CompactTableHead className="text-center">Action</CompactTableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {overdueAssessments.map(assessment => (
                                <TableRow key={assessment.id}>
                                    <CompactTableCell>{assessment.classTime}</CompactTableCell>
                                    <CompactTableCell>{assessment.teacherName}</CompactTableCell>
                                    <CompactTableCell>
                                        <div className="flex items-center gap-2">
                                            <LevelIcon levelName={assessment.level} />
                                            {assessment.level}
                                        </div>
                                    </CompactTableCell>
                                    <CompactTableCell>{assessment.assessmentDate ? format(assessment.assessmentDate.toDate(), 'dd/MM/yy') : 'N/A'}</CompactTableCell>
                                    <CompactTableCell>
                                       <Select
                                          value={localAssessors[assessment.id] || assessment.assessorInitials || NOT_ASSIGNED_VALUE}
                                          onValueChange={(value) => handleLocalAssessorChange(assessment.id, value)}
                                        >
                                          <SelectTrigger className="w-[80px] h-8 text-xs px-2">
                                            <SelectValue placeholder="N/A" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value={NOT_ASSIGNED_VALUE}>N/A</SelectItem>
                                            {assessors.map(assessor => (
                                              <SelectItem key={assessor} value={assessor}>{assessor}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                    </CompactTableCell>
                                    <CompactTableCell className="text-center">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => onComplete(assessment, localAssessors[assessment.id] || assessment.assessorInitials)}
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Complete
                                        </Button>
                                    </CompactTableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}


function AssessmentsContent() {
  const [classAssessments, setClassAssessments] = useState<ClassAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedAssessment, setSelectedAssessment] = useState<ClassAssessment | null>(null);
  const { assessors } = useAssessors();
  const { settings } = useSettings();
  const { toast } = useToast();

  const isDue = (assessment: ClassAssessment) => {
    if (assessment.manualStatus === 'Completed') return false; 
    if (assessment.manualStatus === 'Overdue') return true;
    if (!assessment.assessmentDate) return true; 
    return isBefore(assessment.assessmentDate.toDate(), subWeeks(new Date(), settings.overdueWeeks));
}

  useEffect(() => {
    const today = new Date().getDay();
    const weekMap: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setSelectedDay(weekMap[today] || 'Monday');

    setIsLoading(true);
    const q = query(collection(db, 'assessments'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assessmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassAssessment));
      setClassAssessments(assessmentsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching assessments: ", error);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCompletionAction = async (assessment: ClassAssessment, assessor: string) => {
    try {
      const assessorToSave = assessor === NOT_ASSIGNED_VALUE ? '' : assessor;
      const completionDate = new Date();

      await addAssessmentHistory({
        classId: assessment.classId,
        teacherName: assessment.teacherName,
        level: assessment.level,
        classTime: assessment.classTime,
        assessorInitials: assessorToSave,
        assessmentDate: completionDate,
      });

      await updateClassAssessment(assessment.id, { 
        manualStatus: 'Normal',
        assessmentDate: Timestamp.fromDate(completionDate),
        assessorInitials: assessorToSave,
      });
      
       toast({ title: "Assessment Completed", description: `${assessment.level} for ${assessment.teacherName} marked as complete.` });
    } catch (error) {
      console.error("Error updating completion status: ", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not complete the assessment." });
    }
  };
  
  const handleAssessorChange = async (id: string, newAssessor: string) => {
    try {
        const valueToUpdate = newAssessor === NOT_ASSIGNED_VALUE ? '' : newAssessor;
        await updateClassAssessment(id, { assessorInitials: valueToUpdate });
    } catch (error) {
        console.error("Error updating assessor: ", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AssessmentStatus) => {
    try {
      if (newStatus === 'Completed') {
          toast({ title: "Action Disabled", description: "Please use the 'Complete' button in the Overdue section." });
          return;
      }
      await updateClassAssessment(id, { manualStatus: newStatus });
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const handleDateChange = async (id: string, newDate: Date | undefined) => {
    if (!newDate) return;
    try {
        await updateClassAssessment(id, { assessmentDate: Timestamp.fromDate(newDate) });
        toast({ title: "Date Updated", description: "The assessment date has been changed." });
    } catch (error) {
        console.error("Error updating assessment date: ", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not change the date." });
    }
  }
  
  const filteredAssessments = useMemo(() => {
    return classAssessments.filter(assessment => assessment.dayOfWeek === selectedDay);
  }, [classAssessments, selectedDay]);

  const groupedAssessments = useMemo(() => {
    const grouped = filteredAssessments.reduce((acc, assessment) => {
      const teacher = assessment.teacherName;
      if (!acc[teacher]) {
        acc[teacher] = [];
      }
      acc[teacher].push(assessment);
      return acc;
    }, {} as Record<string, ClassAssessment[]>);

    for (const teacher in grouped) {
      grouped[teacher].sort((a, b) => timeStringToMinutes(a.classTime) - timeStringToMinutes(b.classTime));
    }

    return grouped;
  }, [filteredAssessments]);

  const sortedTeacherNames = useMemo(() => {
    return Object.keys(groupedAssessments).sort((a, b) => a.localeCompare(b));
  }, [groupedAssessments]);

  return (
    <>
    <div className="space-y-6">
       {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
        <OverdueAssessmentsCard 
            assessments={classAssessments}
            selectedDay={selectedDay}
            onComplete={handleCompletionAction}
            overdueWeeks={settings.overdueWeeks}
            assessors={assessors}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Daily Classes & Assessments</CardTitle>
              <Dialog>
                  <DialogTrigger asChild>
                      <Button>Manage Classes</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                      <DialogHeader>
                          <DialogTitle>Manage Classes</DialogTitle>
                          <DialogDescription>
                              Add, edit, or remove classes from the schedule. New classes will automatically create assessments.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="flex-grow overflow-y-auto -mx-6 px-6">
                           <ClassesManager />
                      </div>
                  </DialogContent>
              </Dialog>
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
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : sortedTeacherNames.length > 0 ? (
            sortedTeacherNames.map((teacherName) => {
              const teacherAssessments = groupedAssessments[teacherName];
              return (
              <Card key={teacherName} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl">{teacherName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <CompactTableHead>Level</CompactTableHead>
                          <CompactTableHead>Time</CompactTableHead>
                          <CompactTableHead>Last Assessed</CompactTableHead>
                          <CompactTableHead>Assessor</CompactTableHead>
                          <CompactTableHead>Status</CompactTableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teacherAssessments.map(assessment => (
                          <TableRow 
                            key={assessment.id} 
                            onClick={() => setSelectedAssessment(assessment)}
                            className={cn(
                                "cursor-pointer",
                                assessment.manualStatus === 'Completed' ? 'bg-muted/50' : ''
                            )}
                            >
                            <CompactTableCell>
                                <div className="flex items-center gap-2">
                                    <LevelIcon levelName={assessment.level} />
                                    {assessment.level}
                                </div>
                            </CompactTableCell>
                            <CompactTableCell>{assessment.classTime}</CompactTableCell>
                            <CompactTableCell onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[120px] pl-3 text-left font-normal",
                                                !assessment.assessmentDate && "text-muted-foreground"
                                            )}
                                        >
                                            {assessment.assessmentDate ? (
                                                format(assessment.assessmentDate.toDate(), "dd/MM/yy")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={assessment.assessmentDate?.toDate()}
                                            onSelect={(date) => handleDateChange(assessment.id, date)}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </CompactTableCell>
                            <CompactTableCell onClick={(e) => e.stopPropagation()}>
                               <Select
                                  value={assessment.assessorInitials || NOT_ASSIGNED_VALUE}
                                  onValueChange={(value) => handleAssessorChange(assessment.id, value)}
                                >
                                  <SelectTrigger className="w-[80px] h-8 text-xs px-2">
                                    <SelectValue placeholder="N/A" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={NOT_ASSIGNED_VALUE}>N/A</SelectItem>
                                    {assessors.map(assessor => (
                                      <SelectItem key={assessor} value={assessor}>{assessor}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </CompactTableCell>
                            <CompactTableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={isDue(assessment) ? 'Overdue' : assessment.manualStatus}
                                onValueChange={(value) => handleStatusChange(assessment.id, value as AssessmentStatus)}
                              >
                                <SelectTrigger className={cn(
                                  "w-[110px] h-8 text-xs px-2",
                                  isDue(assessment) && "bg-destructive text-destructive-foreground border-destructive"
                                )}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </CompactTableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )})
          ) : (
            <p className="text-center text-muted-foreground py-8">No classes scheduled for {selectedDay}.</p>
          )}
        </CardContent>
      </Card>
    </div>
    <ClassDetailsDialog 
        assessment={selectedAssessment}
        isOpen={!!selectedAssessment}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedAssessment(null);
            }
        }}
    />
    </>
  );
}


export default function AssessmentsPage() {
    return (
        <AppLayout
            title="Assessments"
            description="Manage daily swim class assessments and track their status."
        >
            <AssessmentsContent />
        </AppLayout>
    )
}
