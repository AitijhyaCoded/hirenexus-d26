// 'use server';
// /**
//  * @fileOverview A Genkit flow to simulate a multi-agent AI debate for candidate evaluation.
//  *
//  * - aiDebateStreaming - A function that orchestrates the structured 3-round AI debate.
//  * - AiDebateStreamingInput - The input type for the aiDebateStreaming function.
//  * - AiDebateStreamingOutput - The return type for the aiDebateStreaming function.
//  */

// import { ai } from '@/ai/genkit';
// import { z } from 'genkit';

// const DebateEventSchema = z.object({
//   agentName: z.string().describe('The name of the AI agent.'),
//   eventType: z
//     .enum(['analysis', 'statement', 'challenge', 'summary', 'progress', 'vote'])
//     .describe('The type of event in the debate.'),
//   content: z.string().describe('The content of the agent\'s statement or action.'),
//   citedSource: z
//     .string()
//     .optional()
//     .describe('The source cited by the agent (e.g., "GitHub", "Resume", "Portfolio", "Transcript").'),
//   round: z.number().describe('The round of the debate (1, 2, or 3).'),
//   timestamp: z.string().datetime().describe('ISO 8601 timestamp of the event.'),
// });

// export type DebateEvent = z.infer<typeof DebateEventSchema>;

// const AiDebateStreamingInputSchema = z.object({
//   candidateName: z.string(),
//   candidateId: z.string(),
//   resumeText: z.string(),
//   githubUrl: z.string().optional(),
//   portfolioData: z.string().optional(),
//   interviewTranscript: z.string().optional(),
//   jobTitle: z.string(),
//   jobDescription: z.string(),
//   jobSkills: z.array(z.string()).optional(),
// });

// export type AiDebateStreamingInput = z.infer<typeof AiDebateStreamingInputSchema>;

// const AiDebateStreamingOutputSchema = z.object({
//   debateTranscript: z.array(DebateEventSchema),
//   finalRecommendation: z.string(),
//   confidenceScore: z.number(),
// });

// export type AiDebateStreamingOutput = z.infer<typeof AiDebateStreamingOutputSchema>;

// const round1Prompt = ai.definePrompt({
//   name: 'round1Prompt',
//   input: { schema: z.object({
//     agentName: z.string(),
//     persona: z.string(),
//     focusSources: z.string(),
//     candidateName: z.string(),
//     data: z.string(),
//     jobContext: z.string(),
//   })},
//   output: { schema: z.object({
//     findings: z.string(),
//     citedSource: z.string(),
//   })},
//   prompt: `You are the {{agentName}}, a senior expert on a high-stakes hiring panel. 
// Your Persona: {{persona}}

// Your task is Round 1: Evidence-Based Initial Take on {{candidateName}}.
// You must analyze the candidate data and provide your initial findings grounded STRICTLY in the provided information. 
// Focus your analysis on: {{focusSources}}

// Target Job Details:
// {{{jobContext}}}

// Candidate Data Summary:
// {{{data}}}

// Instructions:
// 1. Provide a concise, professional initial take on the candidate's qualifications.
// 2. You MUST cite specific evidence from the data sources you are focused on.
// 3. Be objective, critical, and specific. If data is missing for your area of expertise, mention it as a potential risk.`,
// });

// const round2Prompt = ai.definePrompt({
//   name: 'round2Prompt',
//   input: { schema: z.object({
//     agentName: z.string(),
//     persona: z.string(),
//     candidateName: z.string(),
//     previousRoundTranscript: z.string(),
//     data: z.string(),
//     jobContext: z.string(),
//   })},
//   output: { schema: z.object({
//     challenge: z.string(),
//     citedSource: z.string(),
//   })},
//   prompt: `You are the {{agentName}}.
// Your Persona: {{persona}}

// Your task is Round 2: Cross-Examination regarding {{candidateName}}.
// Review the findings from Round 1 of the debate:
// {{{previousRoundTranscript}}}

// Candidate Data for Reference:
// {{{data}}}

// Instructions:
// 1. React to the points made by the other agents in Round 1.
// 2. Look for conflicting data points or missing information in their arguments. 
// 3. Challenge a specific point or defend a weakness mentioned by another agent using the candidate data.
// 4. Cite your evidence source clearly.`,
// });

// const round3Prompt = ai.definePrompt({
//   name: 'round3Prompt',
//   input: { schema: z.object({
//     agentName: z.string(),
//     persona: z.string(),
//     candidateName: z.string(),
//     fullTranscript: z.string(),
//     jobContext: z.string(),
//   })},
//   output: { schema: z.object({
//     vote: z.enum(['Hire', 'No Hire']),
//     justification: z.string(),
//   })},
//   prompt: `You are the {{agentName}}.
// Your Persona: {{persona}}

// Your task is Round 3: Final Consensus for {{candidateName}}.
// Review the entire debate transcript so far:
// {{{fullTranscript}}}

// Instructions:
// 1. Give your final "Hire" or "No Hire" vote for the role.
// 2. Provide exactly a 1-sentence justification for your vote based on the weight of the evidence analyzed.`,
// });

// export async function aiDebateStreaming(input: AiDebateStreamingInput): Promise<AiDebateStreamingOutput> {
//   return aiDebateStreamingFlow(input);
// }

// const aiDebateStreamingFlow = ai.defineFlow(
//   {
//     name: 'aiDebateStreamingFlow',
//     inputSchema: AiDebateStreamingInputSchema,
//     outputSchema: AiDebateStreamingOutputSchema,
//   },
//   async (input) => {
//     const debateTranscript: DebateEvent[] = [];

//     const addEvent = (event: Omit<DebateEvent, 'timestamp'>) => {
//       debateTranscript.push({
//         ...event,
//         timestamp: new Date().toISOString(),
//       });
//     };

//     const dataBlock = `
//       CANDIDATE NAME: ${input.candidateName}
//       RESUME: ${input.resumeText}
//       GITHUB: ${input.githubUrl || 'Not provided'}
//       PORTFOLIO: ${input.portfolioData || 'No specific portfolio data provided'}
//       INTERVIEW TRANSCRIPT/NOTES: ${input.interviewTranscript || 'No interview data available'}
//     `;

//     const jobContext = `
//       ROLE: ${input.jobTitle}
//       DESCRIPTION: ${input.jobDescription}
//       REQUIRED SKILLS: ${input.jobSkills?.join(', ') || 'General industry standards'}
//     `;

//     const personas = [
//       {
//         name: 'Senior Tech Lead',
//         persona: 'Pragmatic software architect. Prioritizes code quality, system design, and technical mastery. Heavily weighs GitHub activity and deep technical experience.',
//         focus: 'GitHub profile, technical complexity in Resume, and core engineering skills.',
//       },
//       {
//         name: 'Product Manager',
//         persona: 'User-focused and delivery-oriented. Looks for impact, problem-solving ability, and alignment with product goals. Values portfolio quality and leadership evidence.',
//         focus: 'Portfolio impact, project descriptions, and evidence of execution in Resume.',
//       },
//       {
//         name: 'HR Specialist',
//         persona: 'Focused on team dynamics and long-term potential. Analyzes communication style, soft skills, and cultural alignment.',
//         focus: 'Interview transcript, soft-skills wording in Resume, and candidate narrative.',
//       }
//     ];

//     // ROUND 1: Evidence-Based Initial Take
//     for (const p of personas) {
//       const { output } = await round1Prompt({
//         agentName: p.name,
//         persona: p.persona,
//         focusSources: p.focus,
//         candidateName: input.candidateName,
//         data: dataBlock,
//         jobContext,
//       });

//       addEvent({
//         agentName: p.name,
//         eventType: 'analysis',
//         content: output!.findings,
//         citedSource: output!.citedSource,
//         round: 1,
//       });
//     }

//     // ROUND 2: Cross-Examination
//     const r1Transcript = debateTranscript.map(e => `${e.agentName}: ${e.content}`).join('\n\n');
//     for (const p of personas) {
//       const { output } = await round2Prompt({
//         agentName: p.name,
//         persona: p.persona,
//         candidateName: input.candidateName,
//         previousRoundTranscript: r1Transcript,
//         data: dataBlock,
//         jobContext,
//       });

//       addEvent({
//         agentName: p.name,
//         eventType: 'challenge',
//         content: output!.challenge,
//         citedSource: output!.citedSource,
//         round: 2,
//       });
//     }

//     // ROUND 3: Final Consensus
//     const fullTranscript = debateTranscript.map(e => `[Round ${e.round}] ${e.agentName}: ${e.content}`).join('\n\n');
//     let hireVotes = 0;
//     for (const p of personas) {
//       const { output } = await round3Prompt({
//         agentName: p.name,
//         persona: p.persona,
//         candidateName: input.candidateName,
//         fullTranscript: fullTranscript,
//         jobContext,
//       });

//       if (output!.vote === 'Hire') hireVotes++;

//       addEvent({
//         agentName: p.name,
//         eventType: 'vote',
//         content: `Decision: ${output!.vote}. ${output!.justification}`,
//         round: 3,
//       });
//     }

//     const finalRec = hireVotes >= 2 ? "Recommend Hiring" : "Do not recommend hiring";
//     const confidence = Math.round((hireVotes / 3) * 100);

//     return {
//       debateTranscript,
//       finalRecommendation: finalRec,
//       confidenceScore: confidence,
//     };
//   }
// );

'use server';
/**
 * @fileOverview A token-optimized Genkit flow for a multi-agent AI candidate debate.
 *
 * - aiDebateStreaming - Orchestrates a structured 3-round debate with strict brevity limits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { executeWithFallback, extractJson } from '../utils';

const DebateEventSchema = z.object({
  agentName: z.string(),
  eventType: z.enum(['analysis', 'statement', 'challenge', 'summary', 'progress', 'vote']),
  content: z.string(),
  citedSource: z.string().optional(),
  round: z.number(),
  timestamp: z.string().datetime(),
});

export type DebateEvent = z.infer<typeof DebateEventSchema>;

const AiDebateStreamingInputSchema = z.object({
  candidateName: z.string(),
  candidateId: z.string(),
  resumeText: z.string(),
  githubUrl: z.string().optional(),
  portfolioData: z.string().optional(),
  interviewTranscript: z.string().optional(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  jobSkills: z.array(z.string()).optional(),
});

export type AiDebateStreamingInput = z.infer<typeof AiDebateStreamingInputSchema>;

const AiDebateStreamingOutputSchema = z.object({
  debateTranscript: z.array(DebateEventSchema),
  finalRecommendation: z.string(),
  confidenceScore: z.number(),
});

export type AiDebateStreamingOutput = z.infer<typeof AiDebateStreamingOutputSchema>;

const round1Prompt = ai.definePrompt({
  name: 'round1Prompt',
  input: {
    schema: z.object({
      agentName: z.string(),
      persona: z.string(),
      focusSources: z.string(),
      candidateName: z.string(),
      data: z.string(),
      jobContext: z.string(),
    })
  },
  prompt: `You are the {{agentName}}. Persona: {{persona}}.
Round 1: Initial Findings for {{candidateName}}.
Analyze the data provided. Focus strictly on: {{focusSources}}.

Role Context:
{{{jobContext}}}

Data:
{{{data}}}

Instructions:
1. Provide a crisp, professional take.
2. Be extremely concise (Max 3 sentences).
3. Cite specific evidence.

Return your answer strictly in JSON format representing this structure:
{
  "output": {
    "findings": "<your maximum 3 sentences findings>",
    "citedSource": "<your cited evidence from data>"
  }
}
DO NOT RETURN ANY MARKDOWN EXCEPT THE JSON OBJECT.`,
});

const round2Prompt = ai.definePrompt({
  name: 'round2Prompt',
  input: {
    schema: z.object({
      agentName: z.string(),
      persona: z.string(),
      candidateName: z.string(),
      previousRoundTranscript: z.string(),
      data: z.string(),
      jobContext: z.string(),
    })
  },
  prompt: `You are the {{agentName}}.
Round 2: Cross-Examination for {{candidateName}}.
Review Round 1:
{{{previousRoundTranscript}}}

Instructions:
1. React to points made by other agents.
2. Identify a conflict or a gap in their logic using candidate data.
3. Keep it brief (Max 2 sentences).

Return your answer strictly in JSON format representing this structure:
{
  "output": {
    "challenge": "<your maximum 2 sentences challenge/reaction>",
    "citedSource": "<your cited evidence from data>"
  }
}
DO NOT RETURN ANY MARKDOWN EXCEPT THE JSON OBJECT.`,
});

const round3Prompt = ai.definePrompt({
  name: 'round3Prompt',
  input: {
    schema: z.object({
      agentName: z.string(),
      persona: z.string(),
      candidateName: z.string(),
      fullTranscript: z.string(),
    })
  },
  prompt: `You are the {{agentName}}.
Round 3: Final Consensus for {{candidateName}}.
Transcript:
{{{fullTranscript}}}

Instructions:
1. State "Hire" or "No Hire".
2. Provide a 1-sentence justification summarizing the core reason.

Return your answer strictly in JSON format representing this structure:
{
  "output": {
    "vote": "Hire | No Hire",
    "justification": "<exactly 1 sentence justification>"
  }
}
DO NOT RETURN ANY MARKDOWN EXCEPT THE JSON OBJECT.`,
});

export async function aiDebateStreaming(input: AiDebateStreamingInput): Promise<AiDebateStreamingOutput> {
  return aiDebateStreamingFlow(input);
}

const aiDebateStreamingFlow = ai.defineFlow(
  {
    name: 'aiDebateStreamingFlow',
    inputSchema: AiDebateStreamingInputSchema,
  },
  async (input) => {
    const debateTranscript: DebateEvent[] = [];
    const addEvent = (event: Omit<DebateEvent, 'timestamp'>) => {
      debateTranscript.push({ ...event, timestamp: new Date().toISOString() });
    };

    const dataBlock = `
      RESUME: ${input.resumeText}
      GITHUB: ${input.githubUrl || 'None'}
      PORTFOLIO: ${input.portfolioData || 'None'}
      INTERVIEW: ${input.interviewTranscript || 'None'}
    `;

    const jobContext = `ROLE: ${input.jobTitle}. DESCRIPTION: ${input.jobDescription}. SKILLS: ${input.jobSkills?.join(', ')}`;

    const personas = [
      { name: 'Senior Tech Lead', persona: 'Pragmatic, weighs GitHub and tech mastery.', focus: 'Technical depth and GitHub.' },
      { name: 'Product Manager', persona: 'Impact-oriented, looks for project delivery.', focus: 'Portfolio impact and execution.' },
      { name: 'HR Specialist', persona: 'Focuses on soft skills and culture.', focus: 'Interviews and soft skills.' }
    ];

    // ROUND 1
    for (const p of personas) {
      const { text } = await executeWithFallback(round1Prompt, {
        agentName: p.name, persona: p.persona, focusSources: p.focus,
        candidateName: input.candidateName, data: dataBlock, jobContext
      });
      const parsedOutput = extractJson(text);
      if (parsedOutput) {
        addEvent({ agentName: p.name, eventType: 'analysis', content: parsedOutput.findings, citedSource: parsedOutput.citedSource, round: 1 });
      }
    }

    // ROUND 2
    const r1Text = debateTranscript.map(e => `${e.agentName}: ${e.content}`).join('\n');
    for (const p of personas) {
      const { text } = await executeWithFallback(round2Prompt, {
        agentName: p.name, persona: p.persona, candidateName: input.candidateName,
        previousRoundTranscript: r1Text, data: dataBlock, jobContext
      });
      const parsedOutput = extractJson(text);
      if (parsedOutput) {
        addEvent({ agentName: p.name, eventType: 'challenge', content: parsedOutput.challenge, citedSource: parsedOutput.citedSource, round: 2 });
      }
    }

    // ROUND 3
    const fullText = debateTranscript.map(e => `R${e.round} ${e.agentName}: ${e.content}`).join('\n');
    let hireVotes = 0;
    for (const p of personas) {
      const { text } = await executeWithFallback(round3Prompt, {
        agentName: p.name, persona: p.persona, candidateName: input.candidateName, fullTranscript: fullText
      });
      const parsedOutput = extractJson(text);
      if (parsedOutput) {
        if (parsedOutput.vote === 'Hire') hireVotes++;
        addEvent({ agentName: p.name, eventType: 'vote', content: `Decision: ${parsedOutput.vote}. ${parsedOutput.justification}`, round: 3 });
      }
    }

    return {
      debateTranscript,
      finalRecommendation: hireVotes >= 2 ? "Recommend Hiring" : "Do not recommend hiring",
      confidenceScore: Math.round((hireVotes / 3) * 100),
    };
  }
);
