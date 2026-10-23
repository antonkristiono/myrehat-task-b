import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import { FALLBACK_REPLY } from "./waha";

const SYSTEM_PROMPT = `You are Rehat, the WhatsApp concierge for BuyHomestay (Malaysia).
Help buyers understand the four listing categories: "Buy Property",
"Buy land to build homestay", "Buy Airbnb Profile", and "Buy Airbnb Business".
Rules:
- Answer in the same language the customer used (Bahasa Melayu, English, or Indonesian).
- Be warm, brief, and concrete: at most 80 words, no markdown tables.
- Never invent listings, prices, or availability. If you do not know, say so and
  invite them to browse /listings or speak to a human host.
- If asked to post a listing, explain they need to sign in first, then open /listings/new.`;

export const OPENROUTER_DEFAULT_MODEL = "google/gemini-2.5-flash";

/**
 * Panggil model OpenRouter (AI SDK generateText) untuk membalas pesan WhatsApp.
 * Tidak pernah melempar error ke route: kalau provider gagal/kosong, kirim
 * fallback supaya WAHA tidak retry berulang-ulang.
 */
export async function generateConciergeReply(message: string): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		console.warn("[waha] OPENROUTER_API_KEY is not set, using fallback reply");
		return FALLBACK_REPLY;
	}

	try {
		const openrouter = createOpenRouter({ apiKey });
		const model = openrouter.chat(
			process.env.OPENROUTER_MODEL ?? OPENROUTER_DEFAULT_MODEL,
		);

		const { text } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			prompt: message,
			temperature: 0.4,
			maxOutputTokens: 400,
			maxRetries: 1,
		});

		return text.trim().length > 0 ? text.trim() : FALLBACK_REPLY;
	} catch (error) {
		console.error("[waha] concierge generation failed", error);
		return FALLBACK_REPLY;
	}
}
