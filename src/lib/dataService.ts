
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where, getDoc, orderBy, writeBatch } from 'firebase/firestore';
import type { ClassEntry, MissedAssessment, ClassDemandEntry, MentorSupportEntry, ClassAssessment, DayOfWeek, AssessmentHistoryEntry, ClassNote, Notice, AppSettings } from './types';
import { subWeeks } from 'date-fns';
import { generateNoticeSummary } from '@/ai/flows/generate-notice-summary-flow';

// Generic add function
const addEntry = async <T extends object>(collectionName: string, data: T) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

// Generic update function
const updateEntry = async (collectionName: string, id: string, data: any) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
};

// Generic delete function
const deleteEntry = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};


// Class Functions
export const addClass = (data: Omit<ClassEntry, 'id'>) => addEntry('classes', data);
export const updateClass = (id: string, data: Partial<ClassEntry>) => updateEntry('classes', id, data);

export const deleteClass = async (classId: string) => {
    const batch = writeBatch(db);

    // 1. Delete the class itself
    const classDocRef = doc(db, 'classes', classId);
    batch.delete(classDocRef);

    // 2. Find and delete the corresponding assessment
    const assessmentsQuery = query(collection(db, 'assessments'), where('classId', '==', classId));
    const assessmentsSnapshot = await getDocs(assessmentsQuery);
    
    if (!assessmentsSnapshot.empty) {
        assessmentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    } else {
        console.warn(`Could not find a matching assessment for class ID: ${classId} to delete.`);
    }

    // Commit the batch
    await batch.commit();
};


// ClassAssessment Functions
export const updateClassAssessment = (id: string, data: Partial<ClassAssessment>) => updateEntry('assessments', id, data);

export const addAssessmentHistory = (data: Omit<AssessmentHistoryEntry, 'id' | 'assessmentDate'> & { assessmentDate: Date }) => {
    return addEntry('assessmentHistory', { ...data, assessmentDate: Timestamp.fromDate(data.assessmentDate) });
};
export const deleteAssessmentHistory = (id: string) => deleteEntry('assessmentHistory', id);


export const getAssessmentsForDay = async (day: DayOfWeek): Promise<ClassAssessment[]> => {
    const q = query(collection(db, 'assessments'), where('dayOfWeek', '==', day));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassAssessment));
};


export const countClassesForToday = async (): Promise<number> => {
    const today = new Date();
    const dayOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayOfWeek[today.getDay()];
  
    const q = query(collection(db, 'classes'), where('dayOfWeek', '==', todayName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

export const countOverdueAssessmentsForToday = async (overdueWeeks: number): Promise<number> => {
    const today = new Date();
    const overdueThresholdDate = subWeeks(today, overdueWeeks);
    const dayOfWeek: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayOfWeek[today.getDay()];
  
    const q = query(
        collection(db, 'assessments'), 
        where('dayOfWeek', '==', todayName),
    );
    
    const querySnapshot = await getDocs(q);
    
    let overdueCount = 0;
    querySnapshot.forEach(doc => {
        const assessment = doc.data() as ClassAssessment;
        const assessmentDate = assessment.assessmentDate?.toDate();
        if (assessment.manualStatus === 'Overdue') {
            overdueCount++;
        } else if (assessment.manualStatus !== 'Completed' && assessmentDate && assessmentDate < overdueThresholdDate) {
            overdueCount++;
        } else if (assessment.manualStatus !== 'Completed' && !assessmentDate) {
            overdueCount++;
        }
    });

    return overdueCount;
}

// Missed Assessment Functions
export const addMissedAssessment = (data: Omit<MissedAssessment, 'id' | 'assessmentDate'> & { assessmentDate: Date }) => {
    return addEntry('missedAssessments', { ...data, assessmentDate: Timestamp.fromDate(data.assessmentDate) });
};
export const deleteMissedAssessment = (id: string) => deleteEntry('missedAssessments', id);
export const updateMissedAssessment = (id: string, data: Partial<MissedAssessment>) => updateEntry('missedAssessments', id, data);


// Class Demand Functions
export const addClassDemandEntry = (data: Omit<ClassDemandEntry, 'id' | 'dateAdded'>) => {
    const entry = {
        ...data,
        dateAdded: Timestamp.fromDate(new Date()),
    };
    return addEntry('classDemand', entry);
};
export const updateClassDemandEntry = (id: string, data: Partial<ClassDemandEntry>) => updateEntry('classDemand', id, data);
export const deleteClassDemandEntry = (id: string) => deleteEntry('classDemand', id);

// Mentor Support Functions
export const addMentorSupportEntry = (data: Omit<MentorSupportEntry, 'id' | 'dateAdded'>) => addEntry('mentorSupport', { ...data, dateRequested: Timestamp.fromDate(new Date()) });
export const updateMentorSupportEntry = (id: string, data: Partial<MentorSupportEntry>) => updateEntry('mentorSupport', id, data);
export const deleteMentorSupportEntry = (id: string) => deleteEntry('mentorSupport', id);

// Class Notes Functions
export const addClassNote = (data: Omit<ClassNote, 'id' | 'dateAdded'>) => {
    return addEntry('classNotes', { ...data, dateAdded: Timestamp.fromDate(new Date()) });
};
export const deleteClassNote = (id: string) => deleteEntry('classNotes', id);


// Notice Board Functions
export const addNotice = async (data: Omit<Notice, 'id' | 'dateAdded' | 'summary'>) => {
    try {
        const { summary } = await generateNoticeSummary({ noticeText: data.noteText });
        const newNotice = {
            ...data,
            summary,
            dateAdded: Timestamp.fromDate(new Date()),
        };
        return addEntry('notices', newNotice);
    } catch(e) {
        console.error("Failed to generate summary, saving notice without it.", e);
        // Save without summary if AI fails
         const newNotice = {
            ...data,
            summary: "Summary not available.",
            dateAdded: Timestamp.fromDate(new Date()),
        };
        return addEntry('notices', newNotice);
    }
};

export const deleteNotice = (id: string) => deleteEntry('notices', id);

export const getNoticesForDay = async (day: DayOfWeek): Promise<Notice[]> => {
    const q = query(
        collection(db, 'notices'), 
        where('dayOfWeek', '==', day)
        // Note: Removed orderBy('dateAdded', 'desc') to avoid needing a composite index.
        // Sorting will be handled client-side.
    );
    const querySnapshot = await getDocs(q);
    const notices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
    
    // Sort notices by date on the client side
    return notices.sort((a, b) => b.dateAdded.toMillis() - a.dateAdded.toMillis());
};

export const resetAllAssessments = async () => {
    const batch = writeBatch(db);

    // 1. Reset all assessments
    const assessmentsQuery = query(collection(db, 'assessments'));
    const assessmentsSnapshot = await getDocs(assessmentsQuery);
    assessmentsSnapshot.forEach(doc => {
        batch.update(doc.ref, {
            assessorInitials: '',
            manualStatus: 'Normal',
            // We don't reset assessmentDate here as it should reflect the last completion
        });
    });

    // 2. Delete all assessment history
    const historyQuery = query(collection(db, 'assessmentHistory'));
    const historySnapshot = await getDocs(historyQuery);
    historySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
};


// App Settings
export const updateAppSettings = async (settings: Partial<AppSettings>) => {
    const settingsDocRef = doc(db, 'settings', 'app_settings');
    await updateDoc(settingsDocRef, settings);
};
