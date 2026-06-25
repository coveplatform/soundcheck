// Shared template utilities
export { getAppUrl, COLORS, ADMIN_EMAIL, emailWrapper, emailButton, emailBadge, emailCard, sendEmail } from "./templates";

// Auth emails
export { sendPasswordResetEmail } from "./auth";

// Review/track emails
export {
  sendTierChangeEmail,
  sendTrackQueuedEmail,
  sendReviewProgressEmail,
  sendInvalidTrackLinkEmail,
} from "./reviews";

// Admin emails
export { sendAdminNewTrackNotification, sendAdminNewScoreSubmissionEmail } from "./admin";


// Welcome email
export { sendWelcomeEmail } from "./welcome";
