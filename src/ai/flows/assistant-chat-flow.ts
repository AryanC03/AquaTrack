
'use server';
/**
 * @fileOverview A conversational AI assistant for the AquaTrack application.
 *
 * - chatWithAssistant - Handles a turn in the conversation with the assistant.
 * - ChatMessage - The type for a single chat message.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    AssistantChatInputSchema, 
    type AssistantChatInput, 
    AssistantChatOutputSchema, 
    type AssistantChatOutput
} from '@/lib/types';
import { countClassesForToday } from '@/lib/dataService';


const countTodaysClassesTool = ai.defineTool(
    {
        name: 'countTodaysClasses',
        description: 'Get the total number of classes scheduled for today. Use this when the user asks "how many classes today" or "how many assessments today" or similar questions.',
        inputSchema: z.object({}),
        outputSchema: z.number(),
    },
    async () => {
        return await countClassesForToday();
    }
);


export async function chatWithAssistant(input: AssistantChatInput): Promise<AssistantChatOutput> {
  return assistantChatFlow(input);
}

const assistantChatFlow = ai.defineFlow(
  {
    name: 'assistantChatFlow',
    inputSchema: AssistantChatInputSchema,
    outputSchema: AssistantChatOutputSchema,
  },
  async (input) => {
    // Ensure roles are 'user' or 'model' as expected by the AI
    const history = input.history.map(m => ({ ...m, role: m.role === 'user' ? 'user' : 'model' } as const));

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      history: history,
      prompt: input.message,
      tools: [countTodaysClassesTool],
      system: `You are the AquaTrack Assistant, an expert AI designed to help Aquatics Service Officers and swim school managers. Your role is to provide concise, helpful, and accurate information related to swim school management and swimming techniques.

You are an expert on:
- Effective swimming drills, techniques, and teaching strategies for all skill levels.
- Best practices for scheduling, staff management, and student assessments.
- Managing waitlists and handling common challenges in a swim school.

You can also answer questions about the data in this application, like "how many classes are there today". Use the available tools to answer these questions. When a user asks about assessments, they are usually referring to the number of classes.

Be friendly, professional, and always focus on providing actionable advice. Keep your answers clear and to the point.
`,
    });
    
    const output = llmResponse.text;
    if (!output) {
      throw new Error("The AI failed to generate a response.");
    }
    return output;
  }
);
