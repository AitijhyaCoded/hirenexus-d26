export const GROQ_MODELS = [
    'deepseek-r1-distill-llama-70b',
    'gemma2-9b-it',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile'
];

let currentModelIndex = 0;

export function extractJson(text: string): any {
    try {
        // Attempt parsing directly first
        return JSON.parse(text).output;
    } catch (e) {
        // Strip markdown formatting if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleanText).output;
        } catch (err) {
            // Fallback to finding the first { ... } block
            const match = text.match(/\{[\s\S]*?\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]).output;
                } catch (error) {
                    console.warn("[AI Utils] JSON extraction failed completely:", text);
                    return null;
                }
            }
            return null;
        }
    }
}

export async function executeWithFallback<TInput>(
    promptFn: (input: TInput, config?: any) => Promise<{ text: string }>,
    input: TInput
): Promise<{ text: string }> {
    let attempts = 0;
    const maxAttempts = GROQ_MODELS.length;

    while (attempts < maxAttempts) {
        const model = GROQ_MODELS[currentModelIndex];
        try {
            console.log(`[AI Utils] Executing with model: groq/${model}`);
            const result = await promptFn(input, { model: `groq/${model}` });

            // Rotate model on success for load balancing
            currentModelIndex = (currentModelIndex + 1) % GROQ_MODELS.length;
            return { text: result.text };
        } catch (error: any) {
            console.warn(`[AI Utils] Model groq/${model} failed: ${error.message}. Attempting fallback...`);
            // Shift to the next model
            currentModelIndex = (currentModelIndex + 1) % GROQ_MODELS.length;
            attempts++;
        }
    }

    throw new Error('All available AI models failed to execute. Please try again later.');
}

export const GEMINI_MODELS = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-1.5-pro',
    'googleai/gemini-1.5-flash'
];

let currentGeminiModelIndex = 0;

export async function executeGeminiWithFallback<TOutput>(
    generateFn: (config?: any) => Promise<{ output: TOutput }>
): Promise<{ output: TOutput }> {
    let attempts = 0;
    const maxAttempts = GEMINI_MODELS.length;

    while (attempts < maxAttempts) {
        const model = GEMINI_MODELS[currentGeminiModelIndex];
        try {
            console.log(`[AI Utils] Executing with model: ${model}`);
            const result = await generateFn({ model });

            // Rotate model on success for load balancing
            currentGeminiModelIndex = (currentGeminiModelIndex + 1) % GEMINI_MODELS.length;
            return result as { output: TOutput };
        } catch (error: any) {
            console.warn(`[AI Utils] Model ${model} failed: ${error.message}. Attempting fallback...`);
            // Shift to the next model
            currentGeminiModelIndex = (currentGeminiModelIndex + 1) % GEMINI_MODELS.length;
            attempts++;
        }
    }

    throw new Error('All available Gemini models failed to execute. Please try again later.');
}