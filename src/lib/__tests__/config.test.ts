import { describe, it, expect } from 'vitest';
import { APP_CONFIG } from '../config';

describe('APP_CONFIG', () => {
  it('should have application info', () => {
    expect(APP_CONFIG.APP_NAME).toBe('HealthCare Platform');
    expect(APP_CONFIG.APP_VERSION).toBe('1.0.0');
  });

  it('should have time and date configuration', () => {
    expect(APP_CONFIG.DEFAULT_TIMEZONE).toBe('UTC');
    expect(APP_CONFIG.DATE_FORMAT).toBe('yyyy-MM-dd');
    expect(APP_CONFIG.TIME_FORMAT).toBe('HH:mm');
  });

  it('should have pagination configuration', () => {
    expect(APP_CONFIG.DEFAULT_PAGE_SIZE).toBe(20);
    expect(APP_CONFIG.MAX_PAGE_SIZE).toBe(100);
  });

  it('should have appointment configuration', () => {
    expect(APP_CONFIG.DEFAULT_APPOINTMENT_DURATION).toBe(30);
    expect(APP_CONFIG.MIN_APPOINTMENT_DURATION).toBe(15);
    expect(APP_CONFIG.MAX_APPOINTMENT_DURATION).toBe(120);
    expect(APP_CONFIG.APPOINTMENT_REMINDER_HOURS).toBe(24);
  });

  it('should have booking configuration', () => {
    expect(APP_CONFIG.MAX_ADVANCE_BOOKING_DAYS).toBe(90);
    expect(APP_CONFIG.MIN_BOOKING_NOTICE_HOURS).toBe(2);
    expect(APP_CONFIG.SLOT_HOLD_DURATION_MINUTES).toBe(10);
  });

  it('should have insurance configuration', () => {
    expect(APP_CONFIG.INSURANCE_CACHE_HOURS).toBe(24);
    expect(APP_CONFIG.INSURANCE_VERIFICATION_TIMEOUT_MS).toBe(30000);
  });

  it('should have file upload configuration', () => {
    expect(APP_CONFIG.MAX_FILE_SIZE_MB).toBe(10);
    expect(APP_CONFIG.MAX_FILES_PER_UPLOAD).toBe(5);
    expect(APP_CONFIG.ALLOWED_FILE_TYPES).toContain('application/pdf');
    expect(APP_CONFIG.ALLOWED_FILE_TYPES).toContain('image/jpeg');
  });

  it('should have search configuration', () => {
    expect(APP_CONFIG.SEARCH_DEBOUNCE_MS).toBe(300);
    expect(APP_CONFIG.MIN_SEARCH_LENGTH).toBe(2);
    expect(APP_CONFIG.MAX_SEARCH_RESULTS).toBe(50);
  });

  it('should have compliance configuration', () => {
    expect(APP_CONFIG.DATA_RETENTION_DAYS).toBe(2555); // ~7 years
    expect(APP_CONFIG.SESSION_TIMEOUT_MINUTES).toBe(30);
    expect(APP_CONFIG.PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('should have notification configuration', () => {
    expect(APP_CONFIG.NOTIFICATION_BATCH_SIZE).toBe(50);
    expect(APP_CONFIG.EMAIL_RATE_LIMIT_PER_HOUR).toBe(100);
    expect(APP_CONFIG.SMS_RATE_LIMIT_PER_HOUR).toBe(50);
  });

  it('should have feature flags', () => {
    expect(APP_CONFIG.FEATURES.AI_CHATBOT).toBe(true);
    expect(APP_CONFIG.FEATURES.VIDEO_CONSULTATIONS).toBe(true);
    expect(APP_CONFIG.FEATURES.INSURANCE_VERIFICATION).toBe(true);
  });

  it('should have currency configuration', () => {
    expect(APP_CONFIG.DEFAULT_CURRENCY).toBe('USD');
    expect(APP_CONFIG.MIN_CONSULTATION_FEE).toBe(10);
    expect(APP_CONFIG.MAX_CONSULTATION_FEE).toBe(10000);
  });

  it('should have URL configuration', () => {
    expect(APP_CONFIG.URLS.TERMS).toBe('/terms');
    expect(APP_CONFIG.URLS.PRIVACY).toBe('/privacy-policy');
    expect(APP_CONFIG.URLS.SUPPORT).toBe('/support');
  });

  it('should be immutable (readonly)', () => {
    // TypeScript should prevent this, but we can test runtime
    expect(() => {
      // @ts-expect-error Testing runtime immutability
      APP_CONFIG.APP_NAME = 'Modified';
    }).toThrow();
  });
});
