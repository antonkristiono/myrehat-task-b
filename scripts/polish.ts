#!/usr/bin/env bun
/**
 * scripts/polish.ts — poles deskripsi listing memakai provider
 * `ai-sdk-provider-opencode-sdk` (AI SDK v7, OpenCode 2.x server).
 *
 * Butuh server OpenCode 2.x yang sedang jalan:
 *   OPENCODE_PASSWORD=secret npx @opencode/cli@2.0.24 serve --port 4096
 *
 * Pemakaian:
 *   bun run scripts/polish.ts --title "..." --category "Buy Property" \
 *     --description "rumah 3 bilik dekat cameron, ada air panas..."
 *
 *   bun run scripts/polish.ts --title "..." --file description.txt
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { generateText } from "ai";
import { createOpencode } from "ai-sdk-provider-opencode-sdk";

import {
	type PolishListingInput,
	polishListingDescription,
} from "./polish-core";

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		title: { type: "string" },
		category: { type: "string" },
		description: { type: "string" },
		file: { type: "string" },
		help: { type: "boolean", short: "h" },
	},
	strict: true,
	allowPositionals: false,
});

if (values.help || !values.title) {
	console.log(`Usage:
  bun run scripts/polish.ts --title "3-bedroom homestay" \\
    [--category "Buy Property"] \\
    (--description "raw text" | --file description.txt)

Environment:
  OPENCODE_URL       default http://127.0.0.1:4096
  OPENCODE_PASSWORD  password of the OpenCode 2.x server
  OPENCODE_MODEL     default opencode/big-pickle`);
	process.exit(values.help ? 0 : 1);
}

const description =
	values.description ??
	(values.file ? readFileSync(values.file, "utf8") : undefined);

if (!description?.trim()) {
	console.error("Missing --description or --file");
	process.exit(1);
}

const input: PolishListingInput = {
	title: values.title,
	category: values.category,
	description,
};

const baseUrl = process.env.OPENCODE_URL ?? "http://127.0.0.1:4096";
const password = process.env.OPENCODE_PASSWORD ?? "";
const modelId = process.env.OPENCODE_MODEL ?? "opencode/big-pickle";

const opencode = createOpencode({
	baseUrl,
	clientOptions: {
		headers: {
			Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
		},
	},
});

try {
	const polished = await polishListingDescription(
		input,
		async (prompt, system) => {
			const { text } = await generateText({
				model: opencode(modelId),
				system,
				prompt,
			});

			return text;
		},
	);

	console.log(polished);
} catch (error) {
	console.error(
		`polish failed: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
} finally {
	await opencode.dispose();
}
