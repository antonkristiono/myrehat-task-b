"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const LINKS = [
	{ to: "/", label: "Home" },
	{ to: "/listings", label: "Listings" },
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/ai", label: "AI Chat" },
] as const;

export default function Header() {
	const pathname = usePathname();

	return (
		<div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
			<div className="mx-auto flex w-full max-w-6xl flex-row items-center justify-between gap-2 px-3 py-2 sm:px-4">
				<nav className="flex min-w-0 items-center gap-3 overflow-x-auto text-sm sm:gap-5 sm:text-base">
					{LINKS.map(({ to, label }) => {
						const isActive =
							to === "/" ? pathname === "/" : pathname.startsWith(to);
						return (
							<Link
								key={to}
								href={to}
								className={
									isActive
										? "text-foreground shrink-0 font-medium"
										: "text-muted-foreground hover:text-foreground shrink-0 transition-colors"
								}
							>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex shrink-0 items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</div>
	);
}
