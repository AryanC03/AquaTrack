
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import type { AppSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_DOC_ID = 'app_settings';
const DEFAULT_SETTINGS: AppSettings = {
    overdueWeeks: 4,
};

interface SettingsContextType {
  settings: AppSettings;
  setOverdueWeeks: (weeks: number) => void;
  isSettingsLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const { toast } = useToast();

  const settingsDocRef = doc(db, "settings", SETTINGS_DOC_ID);

  useEffect(() => {
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        console.log("Settings document not found, creating with defaults.");
        setDoc(settingsDocRef, DEFAULT_SETTINGS).catch(e => console.error("Could not create initial app settings:", e));
        setSettings(DEFAULT_SETTINGS);
      }
      setIsSettingsLoading(false);
    }, (error) => {
      console.error("Error listening to settings changes:", error);
      setIsSettingsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettingsInFirestore = async (updatedSettings: Partial<AppSettings>) => {
    try {
      await setDoc(settingsDocRef, updatedSettings, { merge: true });
    } catch (error) {
      console.error("Failed to save settings to Firestore", error);
       toast({
        variant: "destructive",
        title: "Settings Save Failed",
        description: "Your changes could not be saved. Please try again.",
      });
    }
  };

  const setOverdueWeeks = (weeks: number) => {
    const newSettings = { ...settings, overdueWeeks: weeks };
    setSettings(newSettings); // Optimistic update
    updateSettingsInFirestore({ overdueWeeks: weeks });
  };
  
  const value = { settings, setOverdueWeeks, isSettingsLoading };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
