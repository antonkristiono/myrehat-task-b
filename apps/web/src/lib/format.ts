const priceFormatter = new Intl.NumberFormat("en-MY", {
	style: "currency",
	currency: "MYR",
	maximumFractionDigits: 0,
});

/** 1250000 -> "RM 1,250,000" */
export function formatPrice(price: number): string {
	return priceFormatter
		.format(price)
		.replace("MYR", "RM")
		.replace(/\s+/g, " ")
		.trim();
}

/** 60123456789 -> "https://wa.me/60123456789?text=..." */
export function whatsappLink(phone: string, message: string): string {
	const digits = phone.replace(/[^\d]/g, "");
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function formatDate(value: Date | string): string {
	const date = typeof value === "string" ? new Date(value) : value;
	return new Intl.DateTimeFormat("en-MY", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}
