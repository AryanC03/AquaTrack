
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { useAssessors } from '@/context/assessor-context';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/dashboard/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { resetAllAssessments } from '@/lib/dataService';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  initials: z.string().min(1, 'Initials are required').max(3, 'Initials cannot be longer than 3 characters'),
});

type FormValues = z.infer<typeof formSchema>;

function SettingsContent() {
  const { assessors, addAssessor, removeAssessor, isLoading } = useAssessors();
  const { settings, setOverdueWeeks, isSettingsLoading } = useSettings();
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

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

  const handleResetAssessments = async () => {
    setIsResetting(true);
    try {
        await resetAllAssessments();
        toast({
            title: "Assessments Reset",
            description: "All assessment data has been successfully reset.",
        });
    } catch (error) {
        console.error("Failed to reset assessments:", error);
        toast({
            variant: "destructive",
            title: "Reset Failed",
            description: "Could not reset assessments. Please try again.",
        });
    } finally {
        setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Assessment Settings</CardTitle>
                <CardDescription>Configure how assessments are managed.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <Label htmlFor="overdue-weeks">Overdue Threshold</Label>
                    <div className="flex items-center gap-4">
                        {isSettingsLoading ? (
                            <Skeleton className="h-6 w-full" />
                        ) : (
                            <>
                            <Slider
                                id="overdue-weeks"
                                min={1}
                                max={12}
                                step={1}
                                value={[settings.overdueWeeks]}
                                onValueChange={(value) => setOverdueWeeks(value[0])}
                                className="flex-1"
                            />
                            <div className="font-bold text-lg w-12 text-center">
                                {settings.overdueWeeks}
                            </div>
                            </>
                        )}
                        <span className="text-muted-foreground">weeks</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Assessments will be automatically marked as overdue after this period.
                    </p>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Manage Assessors</CardTitle>
                <CardDescription>Add or remove assessors from the list. Changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Current Assessors</h3>
                    {isLoading ? (
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                    </div>
                    ) : (
                    <div className="flex flex-wrap gap-2 min-h-[24px]">
                        {assessors.map((initials) => (
                        <Badge key={initials} variant="secondary" className="flex items-center gap-1.5 pl-2.5 text-base">
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2 max-w-sm">
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
            </CardContent>
        </Card>

        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                 <CardDescription>
                    These are destructive actions. Please be certain before proceeding.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                    <div>
                        <h4 className="font-semibold">Reset All Assessments</h4>
                        <p className="text-sm text-muted-foreground">This will clear all assessment history, statuses, and assigned assessors.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isResetting}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                {isResetting ? 'Resetting...' : 'Reset Assessments'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all assessment history and reset all statuses and assessors to their default state.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetAssessments}>
                                    Yes, reset everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

export default function SettingsPage() {
    return (
        <AppLayout
            title="Settings"
            description="Manage application-wide settings."
        >
            <SettingsContent />
        </AppLayout>
    )
}
