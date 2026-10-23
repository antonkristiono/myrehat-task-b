/**
 * Logika inti pemolesan deskripsi listing.
 *
 * Sengaja dipisah dari CLI (scripts/polish.ts) dan dari provider OpenCode:
 * fungsi ini hanya butuh sebuah `generate` callback, jadi bisa diuji unit
 * dengan mock tanpa server OpenCode maupun API key.
 */

export const POLISH_SYSTEM_PROMPT = `You are a copywriter for BuyHomestay, a Malaysian marketplace for
homestays, land, and Airbnb businesses. Rewrite the seller's raw description into
clear, honest, buyer-focused English.

Rules:
- 60-120 words, plain text only (no markdown, no bullet characters, no headings).
- Keep every concrete fact (rooms, land size, occupancy, location, included items).
- Never invent numbers, amenities, licences, or promises.
- Remove contact details, ALL-CAPS shouting, and repeated words.
- Return only the rewritten description, without quotes or explanation.`;

export type PolishListingInput = {
	title: string;
	category?: string;
	description: string;
};

export type TextGenerator = (prompt: string, system: string) => Promise<string>;

export type PolishOptions = {
	maxAttempts?: number;
	minLength?: number;
	maxInputLength?: number;
};

const DEFAULT_MIN_LENGTH = 10;
const DEFAULT_MAX_INPUT_LENGTH = 4000;

export function buildPolishPrompt(input: PolishListingInput): string {
	const lines = [`Listing title: ${input.title.trim()}`];

	if (input.category?.trim()) {
		lines.push(`Category: ${input.category.trim()}`);
	}

	lines.push(
		"",
		"Raw description:",
		input.description.trim(),
		"",
		"Rewrite it now.",
	);

	return lines.join("\n");
}

/** Bersihkan output model: code fence, tanda kutip pembungkus, baris kosong berlebih. */
export function cleanPolishedText(raw: string): string {
	let text = raw.trim();

	text = text
		.replace(/^```[a-z]*\s*/i, "")
		.replace(/```$/i, "")
		.trim();

	if (text.length >= 2) {
		const first = text[0];
		const last = text[text.length - 1];
		const wrapped =
			(first === '"' && last === '"') ||
			(first === "'" && last === "'") ||
			(first === "“" && last === "”");

		if (wrapped) {
			text = text.slice(1, -1).trim();
		}
	}

	return text
		.replace(/\r\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/**
 * Poles satu deskripsi. Mencoba ulang sekali kalau model mengembalikan teks
 * kosong/terlalu pendek atau provider melempar error.
 */
export async function polishListingDescription(
	input: PolishListingInput,
	generate: TextGenerator,
	options: PolishOptions = {},
): Promise<string> {
	const title = input.title?.trim() ?? "";
	const description = input.description?.trim() ?? "";
	const minLength = options.minLength ?? DEFAULT_MIN_LENGTH;
	const maxInputLength = options.maxInputLength ?? DEFAULT_MAX_INPUT_LENGTH;
	const maxAttempts = Math.max(1, options.maxAttempts ?? 2);

	if (title.length === 0) {
		throw new Error("Listing title is required");
	}

	if (description.length < minLength) {
		throw new Error(`Description must be at least ${minLength} characters`);
	}

	if (description.length > maxInputLength) {
		throw new Error(`Description must be at most ${maxInputLength} characters`);
	}

	const prompt = buildPolishPrompt({ ...input, title, description });
	let lastError: Error = new Error("Could not polish the description");

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const raw = await generate(prompt, POLISH_SYSTEM_PROMPT);
			const polished = cleanPolishedText(raw);

			if (polished.length < minLength) {
				lastError = new Error(
					"Model returned an empty or too-short description",
				);
				continue;
			}

			return polished;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
		}
	}

	throw lastError;
}
