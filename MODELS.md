# HireNexus AI Models & Use Cases

This document provides a comprehensive map of the AI models used throughout the HireNexus candidate lifecycle, detailing the specific use case and rationale for each choice.

---

## 🏗️ 1. Resume Intake & Parsing
*   **Model**: `googleai/gemini-3-flash-preview` (with fallback to `gemini-3.1-flash-lite`)
*   **Use Case**: Structured data extraction from complex PDF resumes.
*   **Why**: 
    *   **Large Context Window**: Handles even 5+ page resumes without truncation.
    *   **Multimodal Capabilities**: "Reads" PDF layout and formatting natively to identify headers and section breaks.
    *   **Structured Output**: Highly reliable at following JSON schemas for skill and project extraction.

---

## 🤖 2. Multi-Agent Expert Analysis (Phase 1)
HireNexus uses a diverse panel of experts to evaluate the candidate from multiple angles.

| Persona | Role | Model Used | Rationale |
| :--- | :--- | :--- | :--- |
| **Marcus** | Senior Tech Lead | `llama-4-scout-17b-instruct` | Optimized for deep technical reasoning and architectural critique. |
| **Sarah** | HR Director | `gpt-oss-120b` | High-parameter model for nuanced behavioral and cultural assessment. |
| **Alex** | Lead PM | `llama-3.3-70b-versatile` | Balanced model for bridge-reasoning between tech and product impact. |
| **Elena** | Engineering Manager | `llama-4-scout-17b-instruct` | Fast and efficient for leadership and process-oriented evaluation. |
| **Leo** | Startup CTO | `gpt-oss-120b` | Peak intelligence for evaluating innovation, versatility, and "scrappiness". |

---

## 🗣️ 3. Panel Debate & Deliberation (Phase 2)
*   **Models**: Same as Phase 1 (Persona-specific).
*   **Use Case**: Sequential cross-examination where agents critique each other's reports.
*   **Why**: Maintains **persona consistency**. By using the same model for both analysis and debate, the agent "remembers" its own logic and can defend its score with continuity.

---

## 🤝 4. Final Consensus Verdict (Phase 3)
*   **Model**: `groq/llama-3.3-70b-versatile`
*   **Use Case**: Synthesis of all agent reports and the debate transcript into a unified "Hiring Committee Report".
*   **Why**: **Logical Reconciliation**. This model is instructed to act as the "Committee Chair," resolving conflicts (e.g., a high EM score vs. a low CTO score) based on the quality of evidence presented in the debate.

---

## 📈 5. Skill Gap & Roadmap Generation
*   **Primary**: `groq/openai/gpt-oss-120b`
*   **Fallback**: `groq/llama-3.3-70b` | `googleai/gemini-3.1-flash-lite`
*   **Use Case**: Comparing candidate profile vs. role requirements to generate a learning path and ATS keyword analysis.
*   **Why**: Requires **strategic planning**. The model must map abstract weaknesses (e.g., "lack of cloud experience") into a concrete timeline (e.g., "Week 1: AWS S3 & Lambda").

---

## 🐙 6. GitHub Portfolio Analysis
*   **Primary**: `groq/llama-3.3-70b-versatile`
*   **Use Case**: Analyzing repository metadata, language distributions, and commit consistency.
*   **Why**: **Pattern Recognition**. Effectively identifies repo complexity (Architecture vs. Basic CRUD) from raw metadata and GQL descriptions.

---

## 💡 7. Personalized Project Recommendations
*   **Primary**: `groq/openai/gpt-oss-120b`
*   **Use Case**: Generating "Level-Up" project ideas that bridge specific skill gaps found in GitHub/Resume.
*   **Why**: **Creative Ideation**. The 120B parameter model is superior at suggesting non-generic projects that specifically build upon a candidate's existing work (e.g., expanding a basic Todo list into a Redis-backed collaborative tool).

---

## 🎙️ 8. Real-time Mock Interview
*   **Model**: `googleai/gemini-3.1-flash-live-preview` (via Gemini Multimodal Live API)
*   **Use Case**: Sub-second latency voice-to-voice interview simulation.
*   **Why**: 
    *   **Multimodal Native**: Directly processes audio input and generates audio output without a separate STT/TTS layer, minimizing latency.
    *   **Dynamic Persona Adaptation**: Can switch between "Supportive" and "Stress Interview" behavior mid-session based on user configuration.

---

## 💬 9. Platform Support Chatbot
*   **Model**: `googleai/gemini-3-flash-preview` (Default Genkit Model)
*   **Use Case**: 24/7 automated support for platform navigation, pricing, and feature explanation.
*   **Why**: 
    *   **Low Latency**: Provides near-instant responses to user queries.
    *   **Strict Formatting**: Efficiently follows system instructions to provide plain-text, concise support without unnecessary markdown fluff.
    *   **Cost-Efficient**: Ideal for high-volume, low-complexity conversational tasks.


---

## ⚙️ 10. Fallback & Resilience Strategy
HireNexus implements a **Recursive Fallback Chain** (`src/ai/utils.ts`):
1.  **Tier 1 (Performance)**: Groq (Llama 3/4) or Gemini Flash for speed and cost.
2.  **Tier 2 (Intelligence)**: GPT-OSS-120B or Llama-3.3-70B if more reasoning is required.
3.  **Tier 3 (Stability)**: Fallback across providers (Groq ↔ Google AI) to ensure 99.9% availability during provider outages.

