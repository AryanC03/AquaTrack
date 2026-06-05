
"use client";

import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import { importClasses } from '@/ai/flows/import-classes-flow';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { writeBatch, collection, doc, Timestamp, addDoc } from 'firebase/firestore';
import type { ClassAssessment, ClassEntry } from '@/lib/types';

export function ImportClassesButton() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const result = await importClasses({ csvData: fileContent });
      
      if (!result.classes || result.classes.length === 0) {
        throw new Error("AI could not find any classes in the file.");
      }

      // Step 1: Add all classes and collect their new document references and data.
      const newClassesWithRefs: { ref: any, data: any }[] = [];
      for (const classData of result.classes) {
          const classDocRef = await addDoc(collection(db, 'classes'), classData);
          newClassesWithRefs.push({ ref: classDocRef, data: classData });
      }

      // Step 2: Create a new batch to add all the corresponding assessments.
      const assessmentBatch = writeBatch(db);
      newClassesWithRefs.forEach(({ ref, data }) => {
        const assessmentDocRef = doc(collection(db, 'assessments'));
        const newAssessment: Omit<ClassAssessment, 'id'> = {
            classId: ref.id, // Use the actual ID from the saved class
            teacherName: data.teacherName,
            classTime: data.classTime,
            level: data.level,
            dayOfWeek: data.dayOfWeek,
            assessmentDate: Timestamp.now(),
            assessorInitials: '',
            manualStatus: 'Normal',
        };
        assessmentBatch.set(assessmentDocRef, newAssessment);
      });

      // Step 3: Commit the batch of assessments.
      await assessmentBatch.commit();

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.classes.length} classes and created their assessments.`,
      });

    } catch (error) {
      console.error("Import failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: `Something went wrong. Please check the file format and your API key. Error: ${errorMessage}`,
      });
    } finally {
      setIsImporting(false);
      // Reset file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv, text/csv"
        className="hidden"
        disabled={isImporting}
      />
      <Button onClick={handleButtonClick} disabled={isImporting} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? 'Importing...' : 'Import Classes'}
      </Button>
    </>
  );
}
