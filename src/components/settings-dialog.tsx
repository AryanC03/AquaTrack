
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Settings, X, Plus } from 'lucide-react';
import { useAssessors } from '@/context/assessor-context';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

const formSchema = z.object({
  initials: z.string().min(1, 'Initials are required').max(3, 'Initials cannot be longer than 3 characters'),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { assessors, addAssessor, removeAssessor, isLoading } = useAssessors();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initials: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    addAssessor(data.initials.toUpperCase());
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage application settings here. Your changes will be saved automatically to Firestore.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Manage Assessors</h3>
            {isLoading ? (
               <div className="flex flex-wrap gap-2">
                 <Skeleton className="h-6 w-12" />
                 <Skeleton className="h-6 w-12" />
                 <Skeleton className="h-6 w-12" />
               </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assessors.map((initials) => (
                  <Badge key={initials} variant="secondary" className="flex items-center gap-1.5 pl-2.5">
                    {initials}
                    <button
                      onClick={() => removeAssessor(initials)}
                      className="rounded-full p-0.5 hover:bg-destructive/20 text-destructive"
                      aria-label={`Remove ${initials}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {assessors.length === 0 && (
                  <p className="text-sm text-muted-foreground">No assessors added yet.</p>
                )}
              </div>
            )}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="initials"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>New Assessor Initials</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CC" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Plus />
                <span className="sr-only">Add Assessor</span>
              </Button>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
