"use client";

import {
	createListingSchema,
	LISTING_CATEGORIES,
} from "@myrehat-task-b/api/schemas/listing";
import { Button } from "@myrehat-task-b/ui/components/button";
import { Input } from "@myrehat-task-b/ui/components/input";
import { Label } from "@myrehat-task-b/ui/components/label";
import { Textarea } from "@myrehat-task-b/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import { orpc } from "@/utils/orpc";

type FieldErrors = Partial<
	Record<
		"title" | "price" | "location" | "category" | "whatsapp" | "description",
		string
	>
>;

function toFieldErrors(error: z.ZodError): FieldErrors {
	const errors: FieldErrors = {};
	for (const issue of error.issues) {
		const key = issue.path[0];
		if (typeof key === "string" && !(key in errors)) {
			errors[key as keyof FieldErrors] = issue.message;
		}
	}
	return errors;
}

export function ListingForm() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [title, setTitle] = useState("");
	const [price, setPrice] = useState("");
	const [location, setLocation] = useState("");
	const [category, setCategory] = useState("");
	const [whatsapp, setWhatsapp] = useState("");
	const [description, setDescription] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});

	const createListing = useMutation(
		orpc.listings.create.mutationOptions({
			onSuccess: () => {
				toast.success("Listing published");
				queryClient.invalidateQueries({
					queryKey: orpc.listings.list.queryKey(),
				});
				router.push("/listings");
			},
			onError: (error) => {
				toast.error(error.message || "Could not publish the listing");
			},
		}),
	);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const candidate = {
			title,
			price: Number(price),
			location,
			category,
			whatsapp,
			description: description.trim().length > 0 ? description : undefined,
		};

		const parsed = createListingSchema.safeParse(candidate);

		if (!parsed.success) {
			setErrors(toFieldErrors(parsed.error));
			toast.error("Please fix the highlighted fields");
			return;
		}

		setErrors({});
		createListing.mutate(parsed.data);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-5" noValidate>
			<div className="space-y-2">
				<Label htmlFor="title">Title</Label>
				<Input
					id="title"
					name="title"
					placeholder="3-bedroom homestay near Tanah Rata"
					value={title}
					onChange={(event) => setTitle(event.target.value)}
					aria-invalid={Boolean(errors.title)}
				/>
				{errors.title ? (
					<p className="text-destructive text-sm">{errors.title}</p>
				) : null}
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="price">Price (RM)</Label>
					<Input
						id="price"
						name="price"
						type="number"
						inputMode="numeric"
						min={1}
						step={1}
						placeholder="450000"
						value={price}
						onChange={(event) => setPrice(event.target.value)}
						aria-invalid={Boolean(errors.price)}
					/>
					{errors.price ? (
						<p className="text-destructive text-sm">{errors.price}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<Label htmlFor="location">Location</Label>
					<Input
						id="location"
						name="location"
						placeholder="Cameron Highlands, Pahang"
						value={location}
						onChange={(event) => setLocation(event.target.value)}
						aria-invalid={Boolean(errors.location)}
					/>
					{errors.location ? (
						<p className="text-destructive text-sm">{errors.location}</p>
					) : null}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="category">Category</Label>
				<select
					id="category"
					name="category"
					value={category}
					onChange={(event) => setCategory(event.target.value)}
					aria-invalid={Boolean(errors.category)}
					className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-8 w-full min-w-0 rounded-none border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-1"
				>
					<option value="" disabled>
						Select a category
					</option>
					{LISTING_CATEGORIES.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				{errors.category ? (
					<p className="text-destructive text-sm">{errors.category}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="whatsapp">WhatsApp number</Label>
				<Input
					id="whatsapp"
					name="whatsapp"
					type="tel"
					inputMode="tel"
					placeholder="+60 12-345 6789"
					value={whatsapp}
					onChange={(event) => setWhatsapp(event.target.value)}
					aria-invalid={Boolean(errors.whatsapp)}
				/>
				{errors.whatsapp ? (
					<p className="text-destructive text-sm">{errors.whatsapp}</p>
				) : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Textarea
					id="description"
					name="description"
					rows={5}
					placeholder="Tell buyers about the rooms, occupancy, and what is included."
					value={description}
					onChange={(event) => setDescription(event.target.value)}
					aria-invalid={Boolean(errors.description)}
				/>
				{errors.description ? (
					<p className="text-destructive text-sm">{errors.description}</p>
				) : null}
			</div>

			<Button
				type="submit"
				size="lg"
				className="h-11 w-full sm:w-auto sm:px-6"
				disabled={createListing.isPending}
			>
				{createListing.isPending ? "Publishing..." : "Publish listing"}
			</Button>
		</form>
	);
}
