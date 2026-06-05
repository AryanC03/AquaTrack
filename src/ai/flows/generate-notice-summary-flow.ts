
'use server';
/**
 * @fileOverview An AI flow for summarizing daily notices.
 *
 * - generateNoticeSummary - A function that creates a short summary for a notice.
 * - GenerateNoticeSummaryInput - The input type for the function.
 * - GenerateNoticeSummaryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  GenerateNoticeSummaryInputSchema,
  type GenerateNoticeSummaryInput,
  GenerateNoticeSummaryOutputSchema,
  type GenerateNoticeSummaryOutput,
} from '@/lib/types';


export async function generateNoticeSummary(input: GenerateNoticeSummaryInput): Promise<GenerateNoticeSummaryOutput> {
  return generateNoticeSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNoticeSummaryPrompt',
  input: { schema: GenerateNoticeSummaryInputSchema },
  output: { schema: GenerateNoticeSummaryOutputSchema },
  prompt: `You are an expert at summarization. Your task is to read the following notice and create a very short, one-line summary. The summary should capture the essence of the notice for a quick glance on a dashboard.

Notice Text: "{{{noticeText}}}"

Return only the one-line summary in the specified JSON format.
`,
});

const generateNoticeSummaryFlow = ai.defineFlow(
  {
    name: 'generateNoticeSummaryFlow',
    inputSchema: GenerateNoticeSummaryInputSchema,
    outputSchema: GenerateNoticeSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a summary.");
    }
    return output;
  }
);
