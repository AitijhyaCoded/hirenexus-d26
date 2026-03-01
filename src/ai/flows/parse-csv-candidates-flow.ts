'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executeGeminiWithFallback } from '../utils';

const ParseCsvCandidatesInputSchema = z.object({
    csvText: z.string().describe("Raw CSV text containing candidate details."),
});

export type ParseCsvCandidatesInput = z.infer<typeof ParseCsvCandidatesInputSchema>;

const ParseCsvCandidatesOutputSchema = z.object({
    candidates: z.array(z.object({
        fullName: z.string(),
        email: z.string().email(),
        role: z.string().describe("The job role the candidate is applying for"),
        resumeUrl: z.string().url().or(z.literal("")).optional(),
        githubUrl: z.string().url().or(z.literal("")).optional(),
    })).describe("List of extracted candidates."),
    success: z.boolean(),
    error: z.string().optional(),
});

export type ParseCsvCandidatesOutput = z.infer<typeof ParseCsvCandidatesOutputSchema>;

export async function parseCsvCandidates(input: ParseCsvCandidatesInput): Promise<ParseCsvCandidatesOutput> {
    return parseCsvCandidatesFlow(input);
}

const parseCsvCandidatesFlow = ai.defineFlow(
    {
        name: 'parseCsvCandidatesFlow',
        inputSchema: ParseCsvCandidatesInputSchema,
        outputSchema: ParseCsvCandidatesOutputSchema,
    },
    async (input) => {
        try {
            const { output } = await executeGeminiWithFallback((config) => {
                return ai.generate({
                    prompt: `You are an expert data extraction assistant. I will provide raw CSV text containing candidate information. Your task is to extract the full name, email, role applied for, resume link, and GitHub profile link for each row. Ignore headers if they exist. Return an array of candidates. Only extract realistic and valid candidates. Leave githubUrl and resumeUrl as empty strings if they are not provided or invalid.

CSV Data:
${input.csvText}
`,
                    output: { schema: ParseCsvCandidatesOutputSchema },
                    ...config
                });
            });

            if (!output || !output.candidates) {
                throw new Error('Gemini returned no structured data from the CSV.');
            }

            return {
                ...output,
                success: true,
            };
        } catch (error: any) {
            console.error('CSV Parsing Error:', error);
            return {
                candidates: [],
                success: false,
                error: error.message || 'Failed to parse CSV.',
            };
        }
    }
);
