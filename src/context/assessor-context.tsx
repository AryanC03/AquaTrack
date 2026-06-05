
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const DEFAULT_ASSESSORS = ['AC', 'OL', 'MK', 'LP', 'AS'];
const SETTINGS_DOC_ID = 'assessors';

interface AssessorContextType {
  assessors: string[];
  addAssessor: (initials: string) => void;
  removeAssessor: (initials: string) => void;
  isLoading: boolean;
}

const AssessorContext = createContext<AssessorContextType | undefined>(undefined);

export function AssessorProvider({ children }: { children: ReactNode }) {
  const [assessors, setAssessors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore reference
  const settingsDocRef = doc(db, "settings", SETTINGS_DOC_ID);

  useEffect(() => {
    setIsLoading(true);

    // Set up a real-time listener. onSnapshot handles initial data load and
    // subsequent updates, and is more resilient to initial connection delays.
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAssessors(data.list || []);
      } else {
        // The document doesn't exist, so create it with defaults.
        console.log("Assessors document not found, creating with defaults.");
        setDoc(settingsDocRef, { list: DEFAULT_ASSESSORS.sort() }).catch(e => console.error("Could not create initial assessors document:", e));
        setAssessors(DEFAULT_ASSESSORS.sort());
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to assessor changes:", error);
      // If the listener fails, it could be due to permissions or being offline.
      // We'll use the last known state or fall back to defaults.
      if (assessors.length === 0) {
          setAssessors(DEFAULT_ASSESSORS.sort());
      }
      setIsLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  const updateAssessorsInFirestore = async (updatedList: string[]) => {
    try {
      await setDoc(settingsDocRef, { list: updatedList.sort() });
    } catch (error) {
      console.error("Failed to save assessors to Firestore", error);
    }
  };

  const addAssessor = (initials: string) => {
    const upperCaseInitials = initials.toUpperCase();
    if (!assessors.includes(upperCaseInitials)) {
      const newList = [...assessors, upperCaseInitials];
      setAssessors(newList.sort()); // Optimistic update
      updateAssessorsInFirestore(newList);
    }
  };

  const removeAssessor = (initials: string) => {
    const newList = assessors.filter(a => a !== initials);
    setAssessors(newList); // Optimistic update
    updateAssessorsInFirestore(newList);
  };

  const value = { assessors, addAssessor, removeAssessor, isLoading };

  return (
    <AssessorContext.Provider value={value}>
      {children}
    </AssessorContext.Provider>
  );
}

export function useAssessors() {
  const context = useContext(AssessorContext);
  if (context === undefined) {
    throw new Error('useAssessors must be used within an AssessorProvider');
  }
  return context;
}
