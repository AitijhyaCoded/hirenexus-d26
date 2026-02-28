// 'use server';
// /**
//  * @fileOverview A Genkit flow for generating a comprehensive evaluation report for a candidate.
//  *
//  * - comprehensiveEvaluationReport - A function that orchestrates the generation of the final evaluation report.
//  * - ComprehensiveEvaluationReportInput - The input type for the comprehensiveEvaluationReport function.
//  * - ComprehensiveEvaluationReportOutput - The return type for the comprehensiveEvaluationReport function.
//  */

// import { ai } from '@/ai/genkit';
// import { z } from 'genkit';

// const ComprehensiveEvaluationReportInputSchema = z.object({
//   jobDescription: z.string().describe('The full job description for the role.'),
//   candidateName: z.string().describe('The name of the candidate being evaluated.'),
//   codeReviewerReport: z.string().describe(
//     'A summarized report from the Code Reviewer AI agent, detailing technical skills and code quality analysis, including evidence.'
//   ),
//   softSkillsEvaluatorReport: z.string().describe(
//     'A summarized report from the Soft Skills Evaluator AI agent, detailing communication, teamwork, and other soft skills analysis, including evidence.'
//   ),
//   culturalFitAssessorReport: z.string().describe(
//     'A summarized report from the Cultural Fit Assessor AI agent, detailing alignment with company values and team dynamics, including evidence.'
//   ),
//   candidateMaterialsSummary: z.string().describe(
//     'A consolidated summary of candidate materials (resume, GitHub, voice interview transcription) used as reference for evidence.'
//   ),
// });

// export type ComprehensiveEvaluationReportInput = z.infer<typeof ComprehensiveEvaluationReportInputSchema>;

// const ComprehensiveEvaluationReportOutputSchema = z.object({
//   recommendation: z.string().describe(
//     "The overall hiring recommendation (e.g., 'Strongly Recommended', 'Recommended', 'Consider with Reservations', 'Not Recommended')."
//   ),
//   confidenceScore: z.number().int().min(0).max(100).describe('A confidence score (0-100) for the recommendation.'),
//   summary: z.string().describe('A comprehensive summary of the candidate\u0027s strengths, weaknesses, and overall fit for the role.'),
//   agentFeedback: z.object({
//     codeReviewer: z.string().describe('Specific feedback derived from the Code Reviewer agent\u0027s analysis.'),
//     softSkillsEvaluator: z.string().describe('Specific feedback derived from the Soft Skills Evaluator agent\u0027s analysis.'),
//     culturalFitAssessor: z.string().describe('Specific feedback derived from the Cultural Fit Assessor agent\u0027s analysis.'),
//   }).describe('Individual feedback summaries from each specialized AI agent.'),
//   citedEvidence: z.string().describe(
//     'Key evidence points supporting the conclusions and recommendation, referenced from the candidate materials or agent reports.'
//   ),
// });

// export type ComprehensiveEvaluationReportOutput = z.infer<typeof ComprehensiveEvaluationReportOutputSchema>;

// export async function comprehensiveEvaluationReport(input: ComprehensiveEvaluationReportInput): Promise<ComprehensiveEvaluationReportOutput> {
//   return comprehensiveEvaluationReportFlow(input);
// }

// const synthesizeComprehensiveReportPrompt = ai.definePrompt({
//   name: 'synthesizeComprehensiveReportPrompt',
//   input: { schema: ComprehensiveEvaluationReportInputSchema },
//   output: { schema: ComprehensiveEvaluationReportOutputSchema },
//   prompt: `You are a Senior HR Supervisor at HireNexus, an expert in talent acquisition, responsible for synthesizing unbiased, data-driven hiring recommendations from specialized AI agents.
// Your primary task is to review the provided candidate information, the job description, and the independent, summarized analyses from the Code Reviewer, Soft Skills Evaluator, and Cultural Fit Assessor AI agents.

// Based on this combined information, generate a comprehensive evaluation report. This report must include an overall hiring recommendation, a confidence score (0-100), a detailed summary of the candidate's fit, and specific feedback from each agent. Crucially, all conclusions and recommendations must be supported by clearly cited evidence from the provided candidate materials and agent reports.

// Job Description:
// {{{jobDescription}}}

// Candidate Name:
// {{{candidateName}}}

// Candidate Materials Overview (for general context and evidence citation):
// {{{candidateMaterialsSummary}}}

// Code Reviewer Agent's Report:
// {{{codeReviewerReport}}}

// Soft Skills Evaluator Agent's Report:
// {{{softSkillsEvaluatorReport}}}

// Cultural Fit Assessor Agent's Report:
// {{{culturalFitAssessorReport}}}

// Instructions for Report Generation:
// 1.  **Overall Recommendation**: Provide a clear and concise hiring recommendation. Choose from: 'Strongly Recommended', 'Recommended', 'Consider with Reservations', or 'Not Recommended'.
// 2.  **Confidence Score**: Assign an integer confidence score from 0 to 100, reflecting your certainty in the recommendation. A higher score means more certainty.
// 3.  **Overall Summary**: Write a comprehensive summary (2-3 paragraphs) of the candidate's main strengths, key areas for development, and overall fit for the role. Integrate insights from all agent reports and the job description.
// 4.  **Agent-Specific Feedback**: For each agent (Code Reviewer, Soft Skills Evaluator, Cultural Fit Assessor), extract and summarize their key findings, positive observations, and any concerns or red flags they raised.
// 5.  **Cited Evidence**: Compile a consolidated string of bullet points listing specific evidence that directly supports your summary, recommendation, and agent feedback. Reference where the evidence comes from (e.g., 'From Code Reviewer Report:', 'From Soft Skills Report:', 'From Cultural Fit Report:', 'From Candidate Materials:').

// Ensure the output strictly adheres to the JSON schema provided. Your report should be professional, objective, and actionable for recruiters.`,
// });

// const comprehensiveEvaluationReportFlow = ai.defineFlow(
//   {
//     name: 'comprehensiveEvaluationReportFlow',
//     inputSchema: ComprehensiveEvaluationReportInputSchema,
//     outputSchema: ComprehensiveEvaluationReportOutputSchema,
//   },
//   async (input) => {
//     const { output } = await synthesizeComprehensiveReportPrompt(input);
//     return output!;
//   }
// );

'use server';
/**
 * @fileOverview A Genkit flow for generating a comprehensive evaluation report for a candidate.
 *
 * - comprehensiveEvaluationReport - A function that orchestrates the generation of the final evaluation report.
 * - ComprehensiveEvaluationReportInput - The input type for the comprehensiveEvaluationReport function.
 * - ComprehensiveEvaluationReportOutput - The return type for the comprehensiveEvaluationReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComprehensiveEvaluationReportInputSchema = z.object({
  jobDescription: z.string().describe('The full job description for the role.'),
  candidateName: z.string().describe('The name of the candidate being evaluated.'),
  codeReviewerReport: z.string().describe(
    'A summarized report from the Code Reviewer AI agent, detailing technical skills and code quality analysis, including evidence.'
  ),
  softSkillsEvaluatorReport: z.string().describe(
    'A summarized report from the Soft Skills Evaluator AI agent, detailing communication, teamwork, and other soft skills analysis, including evidence.'
  ),
  culturalFitAssessorReport: z.string().describe(
    'A summarized report from the Cultural Fit Assessor AI agent, detailing alignment with company values and team dynamics, including evidence.'
  ),
  candidateMaterialsSummary: z.string().describe(
    'A consolidated summary of candidate materials (resume, GitHub, voice interview transcription) used as reference for evidence.'
  ),
});

export type ComprehensiveEvaluationReportInput = z.infer<typeof ComprehensiveEvaluationReportInputSchema>;

const ComprehensiveEvaluationReportOutputSchema = z.object({
  recommendation: z.string().describe(
    "The overall hiring recommendation (e.g., 'Strongly Recommended', 'Recommended', 'Consider with Reservations', 'Not Recommended')."
  ),
  confidenceScore: z.number().int().min(0).max(100).describe('A confidence score (0-100) for the recommendation.'),
  summary: z.string().describe('A comprehensive summary of the candidate\u0027s strengths, weaknesses, and overall fit for the role.'),
  agentFeedback: z.object({
    codeReviewer: z.string().describe('Specific feedback derived from the Code Reviewer agent\u0027s analysis.'),
    softSkillsEvaluator: z.string().describe('Specific feedback derived from the Soft Skills Evaluator agent\u0027s analysis.'),
    culturalFitAssessor: z.string().describe('Specific feedback derived from the Cultural Fit Assessor agent\u0027s analysis.'),
  }).describe('Individual feedback summaries from each specialized AI agent.'),
  citedEvidence: z.string().describe(
    'Key evidence points supporting the conclusions and recommendation, referenced from the candidate materials or agent reports.'
  ),
});

export type ComprehensiveEvaluationReportOutput = z.infer<typeof ComprehensiveEvaluationReportOutputSchema>;

export async function comprehensiveEvaluationReport(input: ComprehensiveEvaluationReportInput): Promise<ComprehensiveEvaluationReportOutput> {
  return comprehensiveEvaluationReportFlow(input);
}

const synthesizeComprehensiveReportPrompt = ai.definePrompt({
  name: 'synthesizeComprehensiveReportPrompt',
  input: { schema: ComprehensiveEvaluationReportInputSchema },
  output: { schema: ComprehensiveEvaluationReportOutputSchema },
  prompt: `You are a Senior HR Supervisor at HireNexus, an expert in talent acquisition, responsible for synthesizing unbiased, data-driven hiring recommendations from specialized AI agents.
Your primary task is to review the provided candidate information, the job description, and the independent, summarized analyses from the Code Reviewer, Soft Skills Evaluator, and Cultural Fit Assessor AI agents.

Based on this combined information, generate a comprehensive evaluation report. This report must include an overall hiring recommendation, a confidence score (0-100), a detailed summary of the candidate's fit, and specific feedback from each agent. Crucially, all conclusions and recommendations must be supported by clearly cited evidence from the provided candidate materials and agent reports.

Job Description:
{{{jobDescription}}}

Candidate Name:
{{{candidateName}}}

Candidate Materials Overview (for general context and evidence citation):
{{{candidateMaterialsSummary}}}

Code Reviewer Agent's Report:
{{{codeReviewerReport}}}

Soft Skills Evaluator Agent's Report:
{{{softSkillsEvaluatorReport}}}

Cultural Fit Assessor Agent's Report:
{{{culturalFitAssessorReport}}}

Instructions for Report Generation:
1.  **Overall Recommendation**: Provide a clear and concise hiring recommendation. Choose from: 'Strongly Recommended', 'Recommended', 'Consider with Reservations', or 'Not Recommended'.
2.  **Confidence Score**: Assign an integer confidence score from 0 to 100, reflecting your certainty in the recommendation. A higher score means more certainty.
3.  **Overall Summary**: Write a comprehensive summary (2-3 paragraphs) of the candidate's main strengths, key areas for development, and overall fit for the role. Integrate insights from all agent reports and the job description.
4.  **Agent-Specific Feedback**: For each agent (Code Reviewer, Soft Skills Evaluator, Cultural Fit Assessor), extract and summarize their key findings, positive observations, and any concerns or red flags they raised.
5.  **Cited Evidence**: Compile a consolidated string of bullet points listing specific evidence that directly supports your summary, recommendation, and agent feedback. Reference where the evidence comes from (e.g., 'From Code Reviewer Report:', 'From Soft Skills Report:', 'From Cultural Fit Report:', 'From Candidate Materials:').

Ensure the output strictly adheres to the JSON schema provided. Your report should be professional, objective, and actionable for recruiters.`,
});

const comprehensiveEvaluationReportFlow = ai.defineFlow(
  {
    name: 'comprehensiveEvaluationReportFlow',
    inputSchema: ComprehensiveEvaluationReportInputSchema,
    outputSchema: ComprehensiveEvaluationReportOutputSchema,
  },
  async (input) => {
    const { output } = await synthesizeComprehensiveReportPrompt(input);
    return output!;
  }
);