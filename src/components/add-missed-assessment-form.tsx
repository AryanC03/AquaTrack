
"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import type { MissedAssessment, ClassEntry, DayOfWeek } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAssessors } from "@/context/assessor-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

const formSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  classId: z.string().min(1, "A class must be selected"),
  assessorInitials: z.string().min(1, "Assessor is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMissedAssessmentFormProps {
  onAddEntry: (data: Omit<MissedAssessment, "id" | "assessmentDate" >, dayOfWeek: DayOfWeek) => void;
  initialDay: DayOfWeek;
}

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


export function AddMissedAssessmentForm({ onAddEntry, initialDay }: AddMissedAssessmentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const { assessors } = useAssessors();

  useEffect(() => {
    if (isOpen) {
        setSelectedDay(initialDay);
    }
  }, [isOpen, initialDay]);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(collection(db, 'classes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassEntry));
      setClasses(classesData);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      classId: "",
      assessorInitials: assessors.length > 0 ? assessors[0] : "",
    },
  });

  useEffect(() => {
    if (assessors.length > 0 && !form.getValues('assessorInitials')) {
      form.setValue('assessorInitials', assessors[0]);
    }
  }, [assessors, form]);

  const classesOnSelectedDay = useMemo(() => {
    return classes.filter(c => c.dayOfWeek === selectedDay);
  }, [classes, selectedDay]);

  const teacherOptions = useMemo(() => {
    const teacherNames = new Set(classesOnSelectedDay.map(c => c.teacherName));
    return Array.from(teacherNames).sort();
  }, [classesOnSelectedDay]);

  const classOptions = useMemo(() => {
    if (!selectedTeacher) return [];
    return classesOnSelectedDay
      .filter(c => c.teacherName === selectedTeacher)
      .sort((a,b) => timeStringToMinutes(a.classTime) - timeStringToMinutes(b.classTime));
  }, [classesOnSelectedDay, selectedTeacher]);

  useEffect(() => {
      form.resetField("classId");
      setSelectedTeacher('');
  }, [selectedDay, form]);

  useEffect(() => {
    form.resetField("classId");
  }, [selectedTeacher, form]);

  const onSubmit = (data: FormValues) => {
    const selectedClass = classes.find(c => c.id === data.classId);
    if (!selectedClass) {
      console.error("Could not find selected class");
      return;
    }
    onAddEntry({
      studentName: data.studentName,
      assessorInitials: data.assessorInitials,
      classId: selectedClass.id,
      teacherName: selectedClass.teacherName,
      classTime: selectedClass.classTime,
      level: selectedClass.level,
      dayOfWeek: selectedDay,
    }, selectedDay);
    form.reset();
    form.setValue('assessorInitials', assessors.length > 0 ? assessors[0] : '');
    setSelectedTeacher('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Missed Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Missed Assessment</DialogTitle>
          <DialogDescription>
            Select the day and class, then enter the student's name for the missed assessment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="space-y-2">
              <FormLabel>Day of the Week</FormLabel>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <Button
                    key={day}
                    type="button"
                    variant={selectedDay === day ? "default" : "outline"}
                    onClick={() => setSelectedDay(day)}
                    size="sm"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Teacher</FormLabel>
              <Select onValueChange={setSelectedTeacher} value={selectedTeacher}>
                  <FormControl>
                  <SelectTrigger disabled={teacherOptions.length === 0}>
                      <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                  {teacherOptions.map(teacher => (
                      <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                  ))}
                  </SelectContent>
              </Select>
            </FormItem>
            
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={classOptions.length === 0 || !selectedTeacher}>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classOptions.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.level} - {cls.classTime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessorInitials"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Assessor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger disabled={assessors.length === 0}>
                          <SelectValue placeholder="Select an assessor" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {assessors.map(assessor => (
                          <SelectItem key={assessor} value={assessor}>{assessor}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Assessment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
