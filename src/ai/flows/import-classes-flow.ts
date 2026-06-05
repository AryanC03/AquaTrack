
/**
 * @fileOverview A simple CSV parser for importing class schedules.
 *
 * - importClasses - A function that parses CSV data and returns structured class information.
 * - ImportClassesInput - The input type for the importClasses function.
 * - ImportClassesOutput - The return type for the importClasses function.
 */

import { z } from 'zod';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type ImportDayOfWeek = (typeof daysOfWeek)[number];

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

/**
 * Parse CSV data with comma-delimited values and quoted fields.
 * Handles fields that contain commas by checking for quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export async function importClasses(input: ImportClassesInput): Promise<ImportClassesOutput> {
  const lines = input.csvData.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row.');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Find column indices
  const staffNameIdx = headers.findIndex(h => h.toLowerCase().includes('staff_name'));
  const startTimeIdx = headers.findIndex(h => h.toLowerCase().includes('start_time'));
  const levelIdx = headers.findIndex(h => h.toLowerCase() === 'level');
  const dayNameIdx = headers.findIndex(h => h.toLowerCase().includes('day_name'));

  if (staffNameIdx === -1 || startTimeIdx === -1 || levelIdx === -1 || dayNameIdx === -1) {
    throw new Error(
      `CSV must contain columns: 'staff_name', 'start_time', 'level', 'day_name'. ` +
      `Found headers: ${headers.join(', ')}`
    );
  }

  const classes: z.infer<typeof ClassSchema>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);

    const teacherName = values[staffNameIdx]?.trim() || '';
    const classTime = values[startTimeIdx]?.trim() || '';
    const level = values[levelIdx]?.trim() || '';
    const dayName = values[dayNameIdx]?.trim() || '';

    // Validate and normalize
    if (!teacherName || !classTime || !level || !dayName) {
      console.warn(`Skipping row ${i}: missing required fields`);
      continue;
    }

    // Validate day of week
    if (!daysOfWeek.includes(dayName as ImportDayOfWeek)) {
      console.warn(`Skipping row ${i}: invalid day "${dayName}". Expected one of: ${daysOfWeek.join(', ')}`);
      continue;
    }

    classes.push({
      teacherName,
      classTime,
      level,
      dayOfWeek: dayName as ImportDayOfWeek,
    });
  }

  if (classes.length === 0) {
    throw new Error('No valid classes found in CSV file.');
  }

  return { classes };
}
