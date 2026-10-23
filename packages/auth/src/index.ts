import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@myrehat-task-b/db";
import * as schema from "@myrehat-task-b/db/schema/auth";
import { betterAuth } from "better-auth";

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

function safeOrigin(url: string): string | undefined {
	try {
		return new URL(url).origin;
	} catch {
		return undefined;
	}
}

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	// Browser memanggil lewat origin web (rewrite Next), jadi origin itu wajib
	// dipercaya. Origin dari BETTER_AUTH_URL ikut dimasukkan supaya deployment
	// tidak gagal 403 "Invalid origin" kalau CORS_ORIGIN belum diset persis sama.
	const trustedOrigins = [
		env.CORS_ORIGIN,
		safeOrigin(env.BETTER_AUTH_URL),
		safeOrigin(env.CORS_ORIGIN),
		...desktopOrigins,
	].filter((origin): origin is string => Boolean(origin));

	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins,
		emailAndPassword: { enabled: true },
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				secure: false,
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
