
'use server';
/**
 * @fileOverview An AI flow for importing class schedules from a CSV file.
 *
 * - importClasses - A function that parses CSV data and returns structured class information.
 * - ImportClassesInput - The input type for the importClasses function.
 * - ImportClassesOutput - The return type for the importClasses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DayOfWeek } from '@/lib/types';

const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassSchema = z.object({
  teacherName: z.string().describe("The full name of the teacher."),
  classTime: z.string().describe("The time the class starts, e.g., '10:00 AM'."),
  level: z.string().describe("The level of the class, e.g., 'Level 1'."),
  dayOfWeek: z.enum(daysOfWeek).describe("The day of the week the class is held."),
});

const ImportClassesInputSchema = z.object({
  csvData: z.string().describe("The full content of the CSV file as a single string."),
});
export type ImportClassesInput = z.infer<typeof ImportClassesInputSchema>;

const ImportClassesOutputSchema = z.object({
  classes: z.array(ClassSchema),
});
export type ImportClassesOutput = z.infer<typeof ImportClassesOutputSchema>;


export async function importClasses(input: ImportClassesInput): Promise<ImportClassesOutput> {
  return importClassesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importClassesPrompt',
  input: { schema: ImportClassesInputSchema },
  output: { schema: ImportClassesOutputSchema },
  prompt: `You are an intelligent data processing agent. Your task is to parse the following CSV data and convert it into a structured JSON array of class schedules.

The user will provide data exported from a spreadsheet. The columns might not be in a consistent order, but they will likely contain information about the teacher's name, the class level, the class time, and the day of the week.

Analyze the provided CSV data and extract these details for each row.

Here is the CSV data:
---
{{{csvData}}}
---

Please return the data in the specified JSON format. Ensure the 'dayOfWeek' field matches one of the allowed values exactly.
`,
});

const importClassesFlow = ai.defineFlow(
  {
    name: 'importClassesFlow',
    inputSchema: ImportClassesInputSchema,
    outputSchema: ImportClassesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to process the CSV data.");
    }
    return output;
  }
);
