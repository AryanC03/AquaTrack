
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import type { MentorSupportEntry, DayOfWeek, ClassEntry } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formSchema = z.object({
  classId: z.string().min(1, "A class must be selected"),
  reason: z.string().min(1, "Reason for support is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMentorSupportFormProps {
  onAddEntry: (data: Omit<MentorSupportEntry, "id" | "dateRequested" >, dayOfWeek: DayOfWeek) => void;
  initialDay: DayOfWeek;
}

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
    if (isPM && hours !== 12) hours += 12;
    else if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

export function AddMentorSupportForm({ onAddEntry, initialDay }: AddMentorSupportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (isOpen) setSelectedDay(initialDay);
  }, [isOpen, initialDay]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'classes'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassEntry));
      setClasses(classesData);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const classesOnSelectedDay = useMemo(() => classes.filter(c => c.dayOfWeek === selectedDay), [classes, selectedDay]);
  const teacherOptions = useMemo(() => Array.from(new Set(classesOnSelectedDay.map(c => c.teacherName))).sort(), [classesOnSelectedDay]);
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
      teacherName: selectedClass.teacherName,
      classTime: selectedClass.classTime,
      level: selectedClass.level,
      classId: selectedClass.id,
      reason: data.reason,
      dayOfWeek: selectedDay,
    }, selectedDay);

    form.reset();
    setSelectedTeacher('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Mentor Support Request</DialogTitle>
          <DialogDescription>
            Select the class and provide a reason for the support request.
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Support</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Reason for support..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
