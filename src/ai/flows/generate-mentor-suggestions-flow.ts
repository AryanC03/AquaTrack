
'use server';
/**
 * @fileOverview An AI flow for providing coaching suggestions for swim instructors.
 *
 * - generateMentorSuggestions - A function that generates coaching tips based on a problem description.
 * - GenerateMentorSuggestionsInput - The input type for the generateMentorSuggestions function.
 * - GenerateMentorSuggestionsOutput - The return type for the generateMentorSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateMentorSuggestionsInputSchema = z.object({
  problemDescription: z.string().describe("A description of a problem a swim instructor is facing with a class."),
  levelName: z.string().describe("The name of the swim level, e.g., 'Level 5 - Penguin'."),
});
export type GenerateMentorSuggestionsInput = z.infer<typeof GenerateMentorSuggestionsInputSchema>;

const SuggestionSchema = z.object({
    title: z.string().describe("A short, descriptive title for the suggestion or drill."),
    description: z.string().describe("A detailed explanation of the suggestion, drill, or game, including steps to follow."),
});

const GenerateMentorSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe("An array of 3-5 actionable suggestions, tips, or games to help the instructor."),
});
export type GenerateMentorSuggestionsOutput = z.infer<typeof GenerateMentorSuggestionsOutputSchema>;


export async function generateMentorSuggestions(input: GenerateMentorSuggestionsInput): Promise<GenerateMentorSuggestionsOutput> {
  return generateMentorSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMentorSuggestionsPrompt',
  input: { schema: GenerateMentorSuggestionsInputSchema },
  output: { schema: GenerateMentorSuggestionsOutputSchema },
  prompt: `You are an expert swim coaching mentor for a swim school. An instructor needs help with their '{{{levelName}}}' class.

Their problem is: "{{{problemDescription}}}"

Based on this problem, provide a list of 3-5 practical and actionable suggestions. These can be drills, games, or teaching techniques that directly address the instructor's issue. The advice should be tailored to the specified class level.

Return the suggestions in the specified JSON format.
`,
});

const generateMentorSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateMentorSuggestionsFlow',
    inputSchema: GenerateMentorSuggestionsInputSchema,
    outputSchema: GenerateMentorSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate any suggestions.");
    }
    return output;
  }
);
