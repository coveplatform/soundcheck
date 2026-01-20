import type { PackageType } from "@/lib/metadata";

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export type Step = "track" | "matching" | "details" | "package";

export const STORAGE_KEY = "get-feedback-progress-v2";

export interface StoredProgress {
  step: Step;
  trackUrl: string;
  inputMode: "url" | "upload";
  uploadedUrl: string;
  uploadedFileName: string;
  title: string;
  artworkUrl: string | null;
  email: string;
  password: string;
  artistName: string;
  selectedGenres: string[];
  feedbackFocus: string;
  packageType: PackageType;
  sourceType: string;
}
