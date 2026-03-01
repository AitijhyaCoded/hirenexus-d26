import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { executeGeminiWithFallback } from '@/ai/utils';

const JobDraftSchema = z.object({
    department: z.enum(['Engineering', 'AI/ML', 'Product', 'Design']).describe("The department of the job"),
    level: z.enum(['Junior (0-3 Yrs exp)', 'Mid (3-7 Yrs exp)', 'Senior (7+ Yrs exp)']).describe("The seniority level of the job"),
    skills: z.array(z.string()).describe("A list of 3-5 core skills required for the job"),
    description: z.string().describe("Context & Goals for the job position. Describe the responsibilities and requirements clearly in 2-3 sentences."),
});

export async function POST(req: Request) {
    try {
        const { title } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
        }

        const { output } = await executeGeminiWithFallback((config) => {
            return ai.generate({
                prompt: `Based on the job title "${title}", intelligently guess and map the most appropriate department, seniority level, 3-5 core technical or soft skills, and a concise 2-3 sentence description of context & goals.`,
                output: { schema: JobDraftSchema },
                ...config
            });
        });

        if (!output) {
            throw new Error('No output generated');
        }

        return NextResponse.json(output);
    } catch (error) {
        console.error('Error generating job details:', error);
        return NextResponse.json({ error: 'Failed to generate job details' }, { status: 500 });
    }
}
