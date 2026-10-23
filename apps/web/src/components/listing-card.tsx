import { Button } from "@myrehat-task-b/ui/components/button";
import { MapPin } from "lucide-react";

import { formatPrice, whatsappLink } from "@/lib/format";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
	return (
		<article className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-sm">
			<div className="flex min-w-0 flex-col gap-1">
				<span className="bg-muted text-muted-foreground w-fit max-w-full rounded-full px-2.5 py-0.5 text-xs font-medium">
					{listing.category}
				</span>
				<h3 className="text-base leading-snug font-semibold break-words">
					{listing.title}
				</h3>
			</div>

			<p className="text-primary text-lg font-semibold">
				{formatPrice(listing.price)}
			</p>

			<p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
				<MapPin className="size-4 shrink-0" aria-hidden />
				<span className="break-words">{listing.location}</span>
			</p>

			{listing.description ? (
				<p className="text-muted-foreground line-clamp-3 text-sm break-words">
					{listing.description}
				</p>
			) : null}

			<Button
				className="mt-auto w-full"
				nativeButton={false}
				render={
					<a
						href={whatsappLink(
							listing.whatsapp,
							`Hi, I'm interested in "${listing.title}" on BuyHomestay.`,
						)}
						target="_blank"
						rel="noopener noreferrer"
					/>
				}
			>
				Contact on WhatsApp
			</Button>
		</article>
	);
}
