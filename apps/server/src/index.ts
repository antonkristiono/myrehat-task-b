import { resolve } from "node:path";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { cors } from "@elysiajs/cors";
import { appRouter } from "@myrehat-task-b/api/routers/index";
import { runMigrations } from "@myrehat-task-b/db/migrate";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	streamText,
	toUIMessageStream,
	type UIMessage,
	wrapLanguageModel,
} from "ai";
import { Elysia } from "elysia";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { auth, db } from "./services";

/**
 * Skema database diterapkan otomatis saat container start (idempotent: Drizzle
 * mencatat migrasi yang sudah jalan di tabel __drizzle_migrations). Dengan
 * begitu deploy pertama langsung punya tabel user/session/listing tanpa perlu
 * menjalankan perintah manual di server.
 */
const migrationsFolder =
	process.env.MIGRATIONS_DIR ??
	resolve(process.cwd(), "../../packages/db/src/migrations");

try {
	await runMigrations(db, migrationsFolder);
	console.log(`[db] migrations applied from ${migrationsFolder}`);
} catch (error) {
	console.error("[db] migration failed", error);
	throw error;
}

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});
const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

new Elysia()
	.use(
		cors({
			origin: ENV.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", async (context) => {
		const { request, status } = context;
		if (["POST", "GET"].includes(request.method)) {
			return auth.handler(request);
		}
		return status(405);
	})
	.all(
		"/rpc*",
		async (context) => {
			const { response } = await rpcHandler.handle(context.request, {
				prefix: "/rpc",
				context: await createContext({ context }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		},
		{
			parse: "none",
		},
	)
	.all(
		"/api-reference*",
		async (context) => {
			const { response } = await apiHandler.handle(context.request, {
				prefix: "/api-reference",
				context: await createContext({ context }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		},
		{
			parse: "none",
		},
	)
	.post("/ai", async (context) => {
		const body = (await context.request.json()) as { messages?: UIMessage[] };
		const uiMessages = body.messages || [];
		const model = wrapLanguageModel({
			model: google("gemini-2.5-flash"),
			middleware: devToolsMiddleware(),
		});
		const result = streamText({
			model,
			messages: await convertToModelMessages(uiMessages),
		});

		return createUIMessageStreamResponse({
			stream: toUIMessageStream({ stream: result.stream }),
		});
	})
	.get("/", () => "OK")
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
