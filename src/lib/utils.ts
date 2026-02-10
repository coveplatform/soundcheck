import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function formatViewCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getTrackStatusBadge(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case "IN_PROGRESS":
    case "QUEUED":
      return {
        label: "In Review",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case "UPLOADED":
      return {
        label: "Uploaded",
        className: "bg-neutral-100 text-neutral-600 border-neutral-200",
      };
    case "PENDING_PAYMENT":
      return {
        label: "Draft",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    default:
      return {
        label: status.replaceAll("_", " "),
        className: "bg-neutral-100 text-neutral-600 border-neutral-200",
      };
  }
}

export function formatReviewCount(completed: number, requested: number): string {
  return `${completed}/${requested} reviews`;
}

export function getTrackAction(Track: {
  status: string;
  id: string;
  reviewsRequested: number;
}): { label: string; href: string } {
  if (track.status === "UPLOADED" || track.reviewsRequested === 0) {
    return {
      label: "Request Reviews",
      href: `/tracks/${track.id}/request-reviews`,
    };
  }
  return {
    label: "View Reviews",
    href: `/tracks/${track.id}`,
  };
}
