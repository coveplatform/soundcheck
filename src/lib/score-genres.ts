/** The score product's genre list — shared by the submit form, the pending-
 * screen genre chips, and the details patch endpoint's validation. */
export const SCORE_GENRES = [
  "Electronic",
  "Hip-Hop",
  "Pop",
  "R&B / Soul",
  "Rock",
  "Indie",
  "Lo-Fi",
  "Dance / Club",
  "Ambient",
  "Singer-Songwriter",
  "Metal",
  "Jazz",
  "Classical",
  "Country",
  "Latin",
  "Other",
] as const;

export type ScoreGenre = (typeof SCORE_GENRES)[number];

export function isScoreGenre(v: unknown): v is ScoreGenre {
  return typeof v === "string" && (SCORE_GENRES as readonly string[]).includes(v);
}
