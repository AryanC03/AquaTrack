"use client";

import { useState } from "react";
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
import type { ClassEntry, DayOfWeek } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


const formSchema = z.object({
  teacherName: z.string().min(1, "Teacher name is required"),
  classTime: z.string().min(1, "Class time is required"),
  level: z.string().min(1, "Level is required"),
  dayOfWeek: z.enum(daysOfWeek, { required_error: "Day of week is required"}),
});

type FormValues = z.infer<typeof formSchema>;

interface AddClassFormProps {
  onAddEntry: (data: Omit<ClassEntry, "id">) => void;
}

export function AddClassForm({ onAddEntry }: AddClassFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacherName: "",
      classTime: "",
      level: "",
      dayOfWeek: "Monday",
    },
  });

  const onSubmit = (data: FormValues) => {
    onAddEntry(data);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Fill in the details for the new class. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="teacherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input placeholder="Level 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Time</FormLabel>
                  <FormControl>
                    <Input placeholder="10:00 AM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {daysOfWeek.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit">Save Class</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
