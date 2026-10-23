import { NextResponse } from "next/server";

import { generateConciergeReply } from "@/lib/concierge";
import { buildWahaReply, parseWahaWebhook } from "@/lib/waha";

export const runtime = "nodejs";
// Webhook tidak boleh di-cache / di-prerender.
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/waha
 *
 * Payload WAHA: { "event": "message", "payload": { "from": "...", "body": "..." } }
 * Balasan:     { "to": "...", "reply": "..." }
 *
 * Route ini sengaja ada di app web (bukan server Elysia) karena webhook
 * didaftarkan ke URL Dokploy yang sama.
 */
export async function POST(request: Request) {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = parseWahaWebhook(payload);

	if (!parsed.ok) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	const reply = await generateConciergeReply(parsed.data.body);

	return NextResponse.json(buildWahaReply(parsed.data.from, reply), {
		status: 200,
	});
}
