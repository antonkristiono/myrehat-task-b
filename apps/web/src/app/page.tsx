import { Button } from "@myrehat-task-b/ui/components/button";
import { ArrowRight, Landmark, MessageCircle, Store } from "lucide-react";
import Link from "next/link";

import { LatestListings } from "@/components/latest-listings";

const HIGHLIGHTS = [
	{
		icon: Landmark,
		title: "Buy a property",
		body: "Homes and homestays that are already running and ready to hand over.",
	},
	{
		icon: Store,
		title: "Start from land",
		body: "Land with homestay potential, so you can build the layout you want.",
	},
	{
		icon: MessageCircle,
		title: "Talk to the host",
		body: "Every listing opens a direct WhatsApp chat. No agents in between.",
	},
];

export default function Home() {
	return (
		<div className="mx-auto w-full max-w-6xl px-4 pb-16">
			<section className="pt-10 pb-8 sm:pt-16 sm:pb-12">
				<p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
					BuyHomestay by MyRehat
				</p>
				<h1 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
					Book homestays directly with hosts
				</h1>
				<p className="text-muted-foreground mt-4 max-w-2xl text-base text-pretty sm:text-lg">
					Skip the middlemen. Browse homestays, land, and Airbnb businesses for
					sale, then message the host straight on WhatsApp.
				</p>
				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Button
						size="lg"
						className="h-11 w-full px-5 text-sm sm:w-auto"
						nativeButton={false}
						render={<Link href="/listings" />}
					>
						Browse listings
						<ArrowRight className="size-4" aria-hidden />
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="h-11 w-full px-5 text-sm sm:w-auto"
						nativeButton={false}
						render={<Link href="/listings/new" />}
					>
						List your homestay
					</Button>
				</div>
			</section>

			<section
				aria-labelledby="how-it-works"
				className="border-t py-8 sm:py-10"
			>
				<h2 id="how-it-works" className="sr-only">
					How BuyHomestay works
				</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
						<div key={title} className="bg-card min-w-0 rounded-xl border p-4">
							<Icon className="text-primary size-5" aria-hidden />
							<h3 className="mt-2 text-sm font-semibold">{title}</h3>
							<p className="text-muted-foreground mt-1 text-sm">{body}</p>
						</div>
					))}
				</div>
			</section>

			<LatestListings />
		</div>
	);
}
