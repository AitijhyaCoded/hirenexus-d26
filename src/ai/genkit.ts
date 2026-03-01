import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAICompatible } from '@genkit-ai/compat-oai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    // Use the OpenAI plugin but route it to Groq's free API
    openAICompatible({
      name: 'groq', // This acts as the prefix for your models
      apiKey: process.env.GROQ_API_KEY, // Ensure this is in your .env
      baseURL: 'https://api.groq.com/openai/v1',
    })],
  // Keeping Gemini as my default model
  model: 'googleai/gemini-2.5-flash',
});

// import { genkit } from 'genkit';
// import { googleAI } from '@genkit-ai/google-genai';
// import { openAICompatible } from '@genkit-ai/compat-oai';

// export const ai = genkit({
//   plugins: [
//     googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
//     // Use the OpenAI plugin but route it to Groq's free API
//     openAICompatible({
//       name: 'groq', // This acts as the prefix for your models
//       apiKey: process.env.GROQ_API_KEY, // Ensure this is in your .env
//       baseURL: 'https://api.groq.com/openai/v1',
//     })],
//   // Keeping Gemini as my default model
//   model: 'googleai/gemini-3-flash-preview',
//   // model: 'googleai/gemini-2.5-flash',
// });