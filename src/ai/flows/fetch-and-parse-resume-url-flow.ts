'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executeGeminiWithFallback } from '../utils';

const FetchAndParseResumeUrlInputSchema = z.object({
    resumeUrl: z.string().url().describe("The URL pointing to the resume PDF or web page."),
});

export type FetchAndParseResumeUrlInput = z.infer<typeof FetchAndParseResumeUrlInputSchema>;

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

export type FetchAndParseResumeUrlOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function fetchAndParseResumeUrl(input: FetchAndParseResumeUrlInput): Promise<FetchAndParseResumeUrlOutput> {
    return fetchAndParseResumeUrlFlow(input);
}

const fetchAndParseResumeUrlFlow = ai.defineFlow(
    {
        name: 'fetchAndParseResumeUrlFlow',
        inputSchema: FetchAndParseResumeUrlInputSchema,
        outputSchema: ParseResumeOutputSchema,
    },
    async (input) => {
        try {
            if (!input.resumeUrl) {
                throw new Error("No URL provided");
            }

            const response = await fetch(input.resumeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch resume from URL: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || '';
            const promptText = 'You are an expert HR data extractor. Read this resume and extract ONLY the most relevant, crisp details. Focus on identifying specific technical skills, the core tech stack used in previous roles, and a brief summary of key projects. Keep descriptions extremely concise to save tokens. Avoid fluff or generic objective statements.';

            let geminiResponse;

            if (contentType.includes('application/pdf')) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Data = buffer.toString('base64');
                const dataUri = `data:application/pdf;base64,${base64Data}`;

                const { output } = await executeGeminiWithFallback((config) => {
                    return ai.generate({
                        prompt: [
                            { text: promptText },
                            { media: { url: dataUri, contentType: 'application/pdf' } },
                        ],
                        output: { schema: ParseResumeOutputSchema },
                        ...config
                    });
                });
                geminiResponse = output;
            } else {
                const textContent = await response.text();
                const truncatedText = textContent.substring(0, 30000);

                const { output } = await executeGeminiWithFallback((config) => {
                    return ai.generate({
                        prompt: `
${promptText}

Resume Content:
${truncatedText}
`,
                        output: { schema: ParseResumeOutputSchema },
                        ...config
                    });
                });
                geminiResponse = output;
            }

            if (!geminiResponse) {
                throw new Error('Gemini returned no structured data from the resume URL.');
            }

            return {
                ...geminiResponse,
                success: true,
            };
        } catch (error: any) {
            console.error('Resume URL Fetch/Parse Error:', error);
            return {
                extractedText: '',
                skills: [],
                projects: [],
                success: false,
                error: error.message || 'Failed to fetch and parse resume URL.',
            };
        }
    }
);
