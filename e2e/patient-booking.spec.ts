import { test, expect } from '@playwright/test';

test.describe('Patient Booking Flow', () => {
  test('patient can search and book appointment', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Sign up (or login if already exists)
    await page.click('text=Get Started');
    
    // Search for specialists
    await page.goto('/search');
    await page.fill('[placeholder*="Search"]', 'cardiology');
    await page.keyboard.press('Enter');

    // Wait for results
    await page.waitForSelector('.specialist-card', { timeout: 5000 });

    // Click first specialist
    await page.click('.specialist-card:first-child');

    // Verify specialist profile loaded
    await expect(page.locator('h1')).toContainText(/Dr\.|Specialist/);

    // Book appointment
    await page.click('text=Book Appointment');

    // Fill booking form
    await page.selectOption('select[name="appointmentType"]', 'telehealth');
    
    // Submit booking
    await page.click('button:has-text("Confirm")');

    // Verify confirmation
    await expect(page.locator('text=Appointment Confirmed')).toBeVisible({ timeout: 10000 });
  });

  test('patient can view appointment history', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to appointments
    await page.click('text=My Appointments');

    // Verify appointments list
    await expect(page.locator('h1')).toContainText('Appointments');
  });
});