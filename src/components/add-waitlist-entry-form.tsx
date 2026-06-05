
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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import type { ClassDemandEntry } from "@/lib/types";

const formSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  classLevel: z.string().min(1, "Class level is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  asoInitials: z.string().min(1, "ASO initials are required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddClassDemandEntryFormProps {
  onAddEntry: (data: Omit<ClassDemandEntry, "id" | "dateAdded" | "dayOfWeek">) => void;
}

export function AddClassDemandEntryForm({ onAddEntry }: AddClassDemandEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      classLevel: "",
      preferredTime: "",
      asoInitials: "",
      notes: "",
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
          Add to Class Demand
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Class Demand</DialogTitle>
          <DialogDescription>
            Fill in the details for the new class demand entry. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <FormField
              control={form.control}
              name="classLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Level</FormLabel>
                  <FormControl>
                    <Input placeholder="Level 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekends, 10 AM - 12 PM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="asoInitials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ASO Initials</FormLabel>
                  <FormControl>
                    <Input placeholder="LP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
