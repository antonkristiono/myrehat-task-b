import { z } from "zod";

/** Event WAHA yang kita layani. Event lain (session.status, ack, dsb) diabaikan. */
export const WAHA_MESSAGE_EVENT = "message";

export const wahaWebhookSchema = z.object({
	event: z.string().min(1, "event is required"),
	payload: z.object({
		from: z.string().trim().min(3, "payload.from is required").max(64),
		body: z.string().trim().min(1, "payload.body is required").max(4000),
		// WAHA mengirim fromMe pada setiap pesan; pesan dari bot sendiri jangan dibalas.
		fromMe: z.boolean().optional(),
	}),
});

export type WahaWebhookPayload = z.infer<typeof wahaWebhookSchema>;
export type WahaMessage = { from: string; body: string };

export type ParseWahaResult =
	| { ok: true; data: WahaMessage }
	| { ok: false; error: string };

/**
 * Validasi payload WAHA { event, payload: { from, body } }.
 * Dipisah dari route supaya bisa diuji unit tanpa HTTP.
 */
export function parseWahaWebhook(input: unknown): ParseWahaResult {
	const parsed = wahaWebhookSchema.safeParse(input);

	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return {
			ok: false,
			error: first
				? `${first.path.join(".") || "payload"}: ${first.message}`
				: "invalid payload",
		};
	}

	const { event, payload } = parsed.data;

	if (event !== WAHA_MESSAGE_EVENT) {
		return { ok: false, error: `unsupported event: ${event}` };
	}

	if (payload.fromMe === true) {
		return { ok: false, error: "ignoring messages sent by the bot itself" };
	}

	return { ok: true, data: { from: payload.from, body: payload.body } };
}

export const FALLBACK_REPLY =
	"Thanks for reaching out to BuyHomestay! Our concierge is a little busy right now — please try again in a moment, or browse listings at /listings.";

/**
 * Bentuk respons wajib: { to, reply }. Selalu trim dan jangan pernah mengirim
 * string kosong ke WhatsApp.
 */
export function buildWahaReply(
	to: string,
	reply: string,
): { to: string; reply: string } {
	const trimmed = reply.trim();
	return {
		to: to.trim(),
		reply: trimmed.length > 0 ? trimmed : FALLBACK_REPLY,
	};
}
