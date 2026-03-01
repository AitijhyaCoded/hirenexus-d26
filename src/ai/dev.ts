import { config } from 'dotenv';
config();

import '@/ai/flows/comprehensive-evaluation-report-flow.ts';
import '@/ai/flows/ai-debate-streaming-flow.ts';
import '@/ai/flows/parse-resume-flow.ts';
import '@/ai/flows/parse-csv-candidates-flow.ts';
import '@/ai/flows/fetch-and-parse-resume-url-flow.ts';