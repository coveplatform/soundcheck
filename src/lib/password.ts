/**
 * Password validation utilities
 * Shared between client and server for consistent validation
 */

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    label: "One number",
    test: (p) => /[0-9]/.test(p),
  },
];

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong";
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  for (const req of PASSWORD_REQUIREMENTS) {
    if (req.test(password)) {
      score++;
    } else {
      errors.push(req.label);
    }
  }

  // Bonus points for extra length and special characters
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 0.5;

  const valid = errors.length === 0;
  const strength: "weak" | "fair" | "strong" =
    score >= 5 ? "strong" : score >= 4 ? "fair" : "weak";

  return { valid, errors, strength, score };
}

/**
 * Password regex for server-side validation
 * Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number";
