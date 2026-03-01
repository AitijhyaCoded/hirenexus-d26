"use server"

import { ai } from "@/ai/genkit"

export interface ChatMessage {
    role: "user" | "model"
    content: string
}

export async function generateSupportResponse(history: ChatMessage[], newPrompt: string) {
    try {
        const systemPrompt = `You are an elegant, highly concise support chatbot specifically built for the HireNexus website.
HireNexus is a next-generation hiring platform that uses a multi-agent AI system to conduct bias-free, transparent evaluations of candidates.
In HireNexus, a panel of AI agents (e.g., a recruiter agent, a technical expert, and a diversity advocate) debate the merits of a candidate.

STRICT GUARDRAILS & FORMATTING RULES:
1. ONLY answer questions related to HireNexus, hiring, AI recruitment, platform features, pricing, or support. Refuse all other general knowledge questions politely.
2. Be EXTREMELY concise. Provide only the absolute necessary details. Keep your answers to 1-3 short, focused sentences.
3. NEVER use Markdown formatting in your response. No bold text, no asterisks (**), no bullet points, and no block letters. Output plain text ONLY.
4. Do not make up features that are not explicitly part of an AI hiring/evaluation platform.
`

        // Format the history for genkit
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: [{ text: msg.content }]
        }))

        const { text } = await ai.generate({
            prompt: newPrompt,
            system: systemPrompt,
            // We pass the previous messages as history to maintain context
            messages: formattedHistory,
        })

        return { success: true, response: text }
    } catch (error: any) {
        console.error("Support Chatbot Error:", error)
        return { success: false, error: "I'm having trouble connecting right now. Please try again later." }
    }
}
