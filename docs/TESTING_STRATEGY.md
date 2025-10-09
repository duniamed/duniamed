# Testing Strategy & Implementation Plan

## Current Status
- **Estimated Coverage**: ~40%
- **E2E Infrastructure**: Not implemented
- **CI/CD Integration**: Partial

## Testing Pyramid

### Unit Tests (Target: 70% coverage)
**Tools**: Vitest, React Testing Library
**Priority**: HIGH

#### Critical Paths to Cover
1. **Authentication**
   - Login/logout flows
   - Session persistence
   - Token refresh
   - Role-based access

2. **Appointment Booking**
   - Slot selection
   - Availability checks
   - Conflict detection
   - Insurance verification

3. **Payment Processing**
   - Price calculations
   - Currency conversions
   - Payment method validation
   - Receipt generation

4. **Data Validation**
   - Form inputs
   - Schema validation (Zod)
   - API request/response
   - Edge cases

#### Implementation Plan
```bash
# Setup
npm install -D @testing-library/jest-dom @testing-library/user-event

# File structure
src/
  lib/
    __tests__/
      errorHandler.test.ts ✓ (exists)
      config.test.ts ✓ (exists)
      supabaseService.test.ts (new)
  hooks/
    __tests__/
      useAvailability.test.ts ✓ (exists)
      useAuth.test.ts (new)
      useAppointments.test.ts (new)
  components/
    __tests__/
      BookAppointment.test.tsx (new)
      WhatsAppManager.test.tsx (new)
```

#### Example: Service Layer Test
```typescript
// src/lib/services/__tests__/supabaseService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseService } from '../supabaseService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('SupabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAppointments', () => {
    it('fetches patient appointments correctly', async () => {
      const mockData = [{ id: '1', scheduled_at: '2024-01-01' }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      } as any);

      const result = await supabaseService.getAppointments('user-1', 'patient');
      
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('handles errors gracefully', async () => {
      const mockError = new Error('Database error');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError })
      } as any);

      const result = await supabaseService.getAppointments('user-1', 'patient');
      
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
```

### Integration Tests (Target: 50% coverage)
**Tools**: Vitest, Supertest (for API), MSW (for mocking)
**Priority**: HIGH

#### Critical Flows
1. **Appointment Creation End-to-End**
   - User authentication
   - Specialist search
   - Availability check
   - Insurance verification
   - Booking confirmation
   - Notification sent

2. **WhatsApp Message Flow**
   - Send message
   - Receive delivery receipt
   - Update UI status
   - Store in database

3. **Calendar Sync**
   - OAuth flow
   - Token refresh
   - Bidirectional sync
   - Conflict resolution

#### Example: Integration Test
```typescript
// src/__tests__/integration/appointmentFlow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { supabaseService } from '@/lib/services/supabaseService';

const server = setupServer(
  http.post('https://*.supabase.co/rest/v1/appointments', () => {
    return HttpResponse.json({ id: '1', status: 'confirmed' });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Appointment Flow', () => {
  it('completes full booking flow', async () => {
    // 1. Create appointment
    const appointment = await supabaseService.createAppointment({
      patient_id: 'patient-1',
      specialist_id: 'specialist-1',
      scheduled_at: '2024-01-15T10:00:00Z',
      consultation_type: 'telehealth',
      fee: 100
    });
    
    expect(appointment.data).toBeTruthy();
    expect(appointment.data?.status).toBe('confirmed');

    // 2. Verify audit log created
    // 3. Check notification sent
    // etc.
  });
});
```

### E2E Tests (Target: 30% coverage)
**Tools**: Playwright
**Priority**: HIGH

#### Setup
```bash
npm install -D @playwright/test
npx playwright install
```

#### Critical User Journeys
1. **Patient Booking Journey**
   ```
   Sign up → Verify email → Search specialists → 
   Book appointment → Add insurance → Complete payment → 
   Receive confirmation
   ```

2. **Specialist Onboarding**
   ```
   Sign up → Upload credentials → Await verification → 
   Set availability → Receive booking → Conduct consultation → 
   Submit notes
   ```

3. **Clinic Management**
   ```
   Create clinic → Invite staff → Configure settings → 
   Monitor appointments → View analytics → 
   Process payments
   ```

#### Example: E2E Test
```typescript
// e2e/patientBooking.spec.ts
import { test, expect } from '@playwright/test';

test('patient can book appointment', async ({ page }) => {
  // Navigate to app
  await page.goto('/');
  
  // Sign up
  await page.click('text=Sign Up');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  
  // Search specialists
  await page.goto('/search');
  await page.fill('[placeholder="Search specialists"]', 'cardiology');
  await page.click('button[type="submit"]');
  
  // Select specialist
  await page.click('.specialist-card:first-child');
  
  // Book appointment
  await page.click('text=Book Appointment');
  await page.selectOption('[name="timeSlot"]', '10:00 AM');
  await page.click('button:has-text("Confirm Booking")');
  
  // Verify confirmation
  await expect(page.locator('text=Appointment Confirmed')).toBeVisible();
});
```

### Load & Performance Tests
**Tools**: k6, Artillery
**Priority**: MEDIUM

#### Scenarios to Test
1. **Concurrent Bookings**
   - 100 users booking simultaneously
   - Verify no double-bookings
   - Check response times < 2s

2. **Search Performance**
   - 1000 concurrent searches
   - Response time < 500ms
   - Cache hit rate > 80%

3. **Realtime Subscriptions**
   - 500 concurrent WebSocket connections
   - Message delivery < 100ms
   - Connection stability

#### Example: k6 Test
```javascript
// k6/booking-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Steady state
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],    // < 1% failures
  },
};

export default function () {
  const payload = JSON.stringify({
    specialist_id: 'specialist-1',
    scheduled_at: '2024-01-15T10:00:00Z',
    patient_id: __VU, // Virtual user ID
  });

  const res = http.post(
    'https://knybxihimqrqwzkdeaio.supabase.co/functions/v1/book-appointment-atomic',
    payload,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(res, {
    'booking successful': (r) => r.status === 200,
    'no conflicts': (r) => !r.json().error,
  });

  sleep(1);
}
```

### Security Tests
**Tools**: OWASP ZAP, Snyk
**Priority**: CRITICAL

#### Test Cases
1. **Authentication**
   - SQL injection attempts
   - XSS attacks
   - CSRF protection
   - Session hijacking
   - JWT tampering

2. **Authorization**
   - Privilege escalation
   - Resource access control
   - RLS policy verification
   - API endpoint protection

3. **Data Protection**
   - PII exposure
   - Encryption at rest/transit
   - Secure headers
   - Rate limiting

#### Example: Security Test
```typescript
// security/rls-policies.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('prevents unauthorized access to appointments', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Try to access appointment as unauthenticated user
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', 'some-appointment-id');

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('allows users to access only their own data', async () => {
    // Sign in as user 1
    const { data: { session } } = await supabase.auth.signInWithPassword({
      email: 'user1@example.com',
      password: 'password'
    });

    // Try to access user 2's data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'user-2-id');

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
```

### Accessibility Tests (WCAG 2.1 AA)
**Tools**: axe-core, Playwright accessibility plugin
**Priority**: HIGH

#### Requirements
- Keyboard navigation
- Screen reader compatibility
- Color contrast (4.5:1 minimum)
- Focus indicators
- ARIA labels
- Alt text for images

#### Example: Accessibility Test
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage meets WCAG AA standards', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocused);
  
  // Verify skip links
  await page.keyboard.press('Tab');
  const skipLink = await page.evaluate(() => document.activeElement?.textContent);
  expect(skipLink).toContain('Skip to main content');
});
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## Test Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:load": "k6 run k6/booking-load.js",
    "test:security": "zap-cli quick-scan http://localhost:5173",
    "test:a11y": "playwright test a11y.spec.ts",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

## Implementation Timeline

### Week 1-2: Setup & Critical Unit Tests
- Configure Playwright
- Set up MSW for mocking
- Write unit tests for authentication
- Write unit tests for appointment booking
- Target: 40% → 50% coverage

### Week 3-4: Integration & E2E
- Integration tests for critical flows
- E2E tests for patient journey
- E2E tests for specialist journey
- Target: 60% coverage

### Week 5-6: Performance & Security
- Load tests for booking system
- Security tests for RLS policies
- Accessibility audit
- Target: 70% coverage

### Week 7-8: CI/CD & Documentation
- GitHub Actions workflows
- Test documentation
- Developer testing guidelines
- Monitoring & alerting setup

## Coverage Goals

| Test Type | Current | Target | Priority |
|-----------|---------|--------|----------|
| Unit | ~40% | 70% | HIGH |
| Integration | 0% | 50% | HIGH |
| E2E | 0% | 30% | HIGH |
| Load | 0% | Critical paths | MEDIUM |
| Security | Manual | Automated | CRITICAL |
| Accessibility | 0% | 100% AA | HIGH |

## Success Metrics

- Zero critical bugs in production
- < 0.1% error rate
- 95th percentile response time < 2s
- 100% critical path E2E coverage
- All WCAG 2.1 AA criteria met
- Security scan with zero high/critical findings
