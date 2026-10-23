import { createAuthClient } from "better-auth/react";

/**
 * Browser selalu memanggil origin yang sama (/api/auth), lalu Next.js
 * me-rewrite ke container API (lihat next.config.ts). Dengan begitu cookie
 * session tetap first-party di http maupun https.
 *
 * Di server (SSR) pakai SERVER_URL dari Docker Compose, fallback ke
 * NEXT_PUBLIC_SERVER_URL untuk `next dev`.
 */
function resolveAuthBaseURL() {
	if (typeof window !== "undefined") {
		return `${window.location.origin}/api/auth`;
	}

	const serverUrl =
		process.env.SERVER_URL ??
		process.env.NEXT_PUBLIC_SERVER_URL ??
		"http://localhost:3000";

	return `${serverUrl.replace(/\/$/, "")}/api/auth`;
}

export const authClient = createAuthClient({
	baseURL: resolveAuthBaseURL(),
});
