'use server';
/**
 * @fileOverview A Genkit flow to extract structured, condensed text from PDF resumes.
 *
 * - parseResume - A function that extracts crisp, relevant details from a PDF data URI.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executeGeminiWithFallback } from '../utils';

const ParseResumeInputSchema = z.object({
  pdfDataUri: z.string().describe(
    "A PDF file as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
  ),
});

export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  extractedText: z.string().describe('A condensed summary of the resume including key skills and experience.'),
  skills: z.array(z.string()).describe('List of technical and soft skills identified.'),
  projects: z.array(z.object({
    name: z.string(),
    techStack: z.array(z.string()),
    description: z.string(),
  })).describe('Key projects and the technologies used, described briefly.'),
  success: z.boolean(),
  error: z.string().optional(),
});

export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await executeGeminiWithFallback((config) => {
        return ai.generate({
          prompt: [
            { text: 'You are an expert HR data extractor. Read this PDF resume and extract ONLY the most relevant, crisp details. Focus on identifying specific technical skills, the core tech stack used in previous roles, and a brief summary of key projects. Keep descriptions extremely concise to save tokens. Avoid fluff or generic objective statements.' },
            { media: { url: input.pdfDataUri, contentType: 'application/pdf' } },
          ],
          output: { schema: ParseResumeOutputSchema },
          ...config
        });
      });

      if (!output) {
        throw new Error('Gemini returned no structured data from the PDF.');
      }

      return {
        ...output,
        success: true,
      };
    } catch (error: any) {
      console.error('Resume Parsing Error:', error);
      return {
        extractedText: '',
        skills: [],
        projects: [],
        success: false,
        error: error.message || 'Failed to parse PDF resume.',
      };
    }
  }
);