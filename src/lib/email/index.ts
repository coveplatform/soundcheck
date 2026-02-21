// Shared template utilities
export { getAppUrl, COLORS, ADMIN_EMAIL, emailWrapper, emailButton, emailBadge, emailCard, sendEmail } from "./templates";

// Auth emails
export { sendPasswordResetEmail } from "./auth";

// Review/track emails
export {
  sendTierChangeEmail,
  sendListenerIntentEmail,
  sendTrackQueuedEmail,
  sendReviewProgressEmail,
  sendInvalidTrackLinkEmail,
  sendReleaseDecisionReport,
} from "./reviews";

// Payment emails
export { sendPurchaseConfirmationEmail } from "./payments";

// Admin emails
export { sendAdminNewTrackNotification } from "./admin";

// Announcement emails
export { buildAnnouncementEmail, sendAnnouncementEmail } from "./announcements";
