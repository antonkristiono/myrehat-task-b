import type { AppRouterClient } from "@myrehat-task-b/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
	environmentManager,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function createQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				toast.error(`Error: ${error.message}`, {
					action: {
						label: "retry",
						onClick: () => {
							query.invalidate();
						},
					},
				});
			},
		}),
	});
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
	if (environmentManager.isServer()) {
		return createQueryClient();
	}

	browserQueryClient ??= createQueryClient();
	return browserQueryClient;
}

/**
 * Browser memakai origin yang sama (/rpc) agar cookie session ikut terkirim;
 * request-nya di-proxy oleh rewrite di next.config.ts ke container API.
 */
function resolveRpcUrl() {
	if (typeof window !== "undefined") {
		return `${window.location.origin}/rpc`;
	}

	const serverUrl =
		process.env.SERVER_URL ??
		process.env.NEXT_PUBLIC_SERVER_URL ??
		"http://localhost:3000";

	return `${serverUrl.replace(/\/$/, "")}/rpc`;
}

export const link = new RPCLink({
	url: resolveRpcUrl(),
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
	headers: async () => {
		if (typeof window !== "undefined") {
			return {};
		}

		const { headers } = await import("next/headers");
		return Object.fromEntries(await headers());
	},
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
