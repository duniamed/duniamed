/**
 * Application Configuration
 * Centralized configuration to eliminate hardcoded values
 */

export const APP_CONFIG = {
  // Application Info
  APP_NAME: 'HealthCare Platform',
  APP_VERSION: '1.0.0',
  
  // Time & Date
  DEFAULT_TIMEZONE: 'UTC',
  DATE_FORMAT: 'yyyy-MM-dd',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Appointments
  DEFAULT_APPOINTMENT_DURATION: 30, // minutes
  MIN_APPOINTMENT_DURATION: 15,
  MAX_APPOINTMENT_DURATION: 120,
  APPOINTMENT_REMINDER_HOURS: 24,
  APPOINTMENT_BUFFER_MINUTES: 15,
  
  // Booking
  MAX_ADVANCE_BOOKING_DAYS: 90,
  MIN_BOOKING_NOTICE_HOURS: 2,
  SLOT_HOLD_DURATION_MINUTES: 10,
  
  // Insurance
  INSURANCE_CACHE_HOURS: 24,
  INSURANCE_VERIFICATION_TIMEOUT_MS: 30000,
  
  // Calendar
  CALENDAR_SYNC_INTERVAL_MINUTES: 15,
  CALENDAR_TOKEN_REFRESH_BUFFER_MINUTES: 5,
  
  // Files & Uploads
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_PER_UPLOAD: 5,
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Search
  SEARCH_DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 50,
  
  // Reviews
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 2000,
  REVIEW_MODERATION_THRESHOLD: 0.7,
  
  // Chat
  MAX_MESSAGE_LENGTH: 5000,
  CHAT_POLLING_INTERVAL_MS: 3000,
  TYPING_INDICATOR_TIMEOUT_MS: 5000,
  
  // Waitlist
  WAITLIST_NOTIFICATION_RETRY_COUNT: 3,
  WAITLIST_NOTIFICATION_RETRY_DELAY_MS: 5000,
  
  // Performance
  API_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  
  // Caching
  CACHE_TTL_SHORT_MINUTES: 5,
  CACHE_TTL_MEDIUM_MINUTES: 30,
  CACHE_TTL_LONG_HOURS: 24,
  
  // Compliance
  DATA_RETENTION_DAYS: 2555, // ~7 years (HIPAA requirement)
  SESSION_TIMEOUT_MINUTES: 30,
  PASSWORD_MIN_LENGTH: 8,
  MFA_CODE_LENGTH: 6,
  
  // Notifications
  NOTIFICATION_BATCH_SIZE: 50,
  EMAIL_RATE_LIMIT_PER_HOUR: 100,
  SMS_RATE_LIMIT_PER_HOUR: 50,
  
  // Video Consultations
  VIDEO_ROOM_DURATION_HOURS: 2,
  VIDEO_QUALITY_DEFAULT: 'standard',
  
  // Fees & Currency
  DEFAULT_CURRENCY: 'USD',
  MIN_CONSULTATION_FEE: 10,
  MAX_CONSULTATION_FEE: 10000,
  
  // Feature Flags
  FEATURES: {
    AI_CHATBOT: true,
    VIDEO_CONSULTATIONS: true,
    GROUP_BOOKING: true,
    WAITLIST: true,
    INSURANCE_VERIFICATION: true,
    CALENDAR_SYNC: true,
    CARE_PATHWAYS: true,
    PRESCRIPTIONS: true,
    LAB_ORDERS: true,
    DOCUMENT_SHARING: true,
    REVIEWS: true,
    COMMUNITY_QA: true,
    RPM_DEVICES: true,
    SHIFT_MARKETPLACE: true,
  },
  
  // URLs
  URLS: {
    TERMS: '/terms',
    PRIVACY: '/privacy-policy',
    SUPPORT: '/support',
    DOCUMENTATION: '/docs',
  },
} as const;

// Type-safe config access
export type AppConfig = typeof APP_CONFIG;
