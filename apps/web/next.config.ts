import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const withVarlock = varlockNextConfigPlugin();

import type { NextConfig } from "next";

// Inside Docker Compose the API container is reachable as `server`; in local
// development it is `localhost`. Proxy same-origin requests so browser calls to
// /api/auth and /rpc never need a cross-origin hop (cookies stay first-party).
const serverUrl = process.env.SERVER_URL ?? "http://server:3000";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	output: "standalone",
	transpilePackages: ["shiki"],
	async rewrites() {
		return [
			{ source: "/rpc/:path*", destination: `${serverUrl}/rpc/:path*` },
			{
				source: "/api/auth/:path*",
				destination: `${serverUrl}/api/auth/:path*`,
			},
		];
	},
};

export default withVarlock(nextConfig);
