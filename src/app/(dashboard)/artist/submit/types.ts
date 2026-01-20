export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export type Step = "artist" | "track" | "details" | "upgrade";
export type UploadMode = "link" | "file" | "stems" | "ableton";
export type AbletonMode = "analyze" | "project";

export interface SubmitFormState {
  // Artist profile
  hasProfile: boolean | null;
  artistName: string;
  
  // Track info
  uploadMode: UploadMode;
  url: string;
  uploadedUrl: string;
  uploadedFileName: string;
  uploadedDuration: number | null;
  title: string;
  artworkUrl?: string;
  feedbackFocus: string;
  selectedGenres: string[];
  allowPurchase: boolean;
  
  // Package
  selectedPackage: string;
  useFreeTrial: boolean;
  freeCredits: number;
}
