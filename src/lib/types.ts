
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type AssessmentStatus = 'Normal' | 'Overdue' | 'Completed';

export interface ClassAssessment {
  id: string;
  classId: string; // Link to the ClassEntry
  teacherName: string;
  classTime: string;
  level: string;
  assessmentDate: Timestamp;
  assessorInitials: string;
  dayOfWeek: DayOfWeek;
  manualStatus: AssessmentStatus;
}

export interface AssessmentHistoryEntry {
  id: string;
  classId: string;
  teacherName: string;
  classTime: string;
  level: string;
  assessorInitials: string;
  assessmentDate: Timestamp;
}

export interface MissedAssessment {
  id: string;
  studentName: string;
  teacherName: string;
  classTime: string;
  assessmentDate: Timestamp;
  assessorInitials: string;
  dayOfWeek: DayOfWeek;
  classId: string; 
  level: string;
}

export interface ClassDemandEntry {
  id: string;
  studentName: string;
  classLevel: string;
  preferredTime: string;
  dateAdded: Timestamp;
  asoInitials: string;
  notes?: string;
  dayOfWeek: DayOfWeek;
}

export interface MentorSupportEntry {
  id: string;
  teacherName: string;
  classTime: string;
  level: string;
  classId: string;
  reason: string;
  dateRequested: Timestamp;
  dayOfWeek: DayOfWeek;
}

export interface ClassEntry {
  id: string;
  teacherName: string;
  classTime: string;
  level: string;
  dayOfWeek: DayOfWeek;
}

export interface Level {
    id: string;
    name: string;
    category: string;
    skills: string[];
    note?: string;
}

export interface ClassNote {
  id: string;
  classId: string;
  noteText: string;
  asoInitials: string;
  dateAdded: Timestamp;
}

export interface Notice {
  id: string;
  dayOfWeek: DayOfWeek;
  noteText: string;
  summary: string;
  asoInitials: string;
  dateAdded: Timestamp;
}

export interface AppSettings {
  overdueWeeks: number;
  dailyOverdueWeeks: Record<DayOfWeek, number>;
}


// Schema for AI Chat
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const AssistantChatInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  message: z.string(),
});
export type AssistantChatInput = z.infer<typeof AssistantChatInputSchema>;

export const AssistantChatOutputSchema = z.string();
export type AssistantChatOutput = z.infer<typeof AssistantChatOutputSchema>;


// Schema for Notice Summary AI
export const GenerateNoticeSummaryInputSchema = z.object({
  noticeText: z.string().describe("The full text of a notice to be summarized."),
});
export type GenerateNoticeSummaryInput = z.infer<typeof GenerateNoticeSummaryInputSchema>;

export const GenerateNoticeSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise, one-line summary of the notice."),
});
export type GenerateNoticeSummaryOutput = z.infer<typeof GenerateNoticeSummaryOutputSchema>;
