# DUNIAMED Site Structure & Information Architecture

## Overview
This document outlines the complete site structure, routing conventions, and navigation hierarchy for the DUNIAMED healthcare platform.

## Key Principles
- **Homepage**: `/home` is the canonical homepage; root `/` redirects to `/home`
- **User-centric hierarchy**: Organized by user roles (patient, specialist, clinic, admin)
- **Shallow nesting**: Maximum 3 levels deep
- **Consistent patterns**: Predictable URL structures for all user types
- **SEO-friendly slugs**: Kebab-case, descriptive, lowercase

---

## Complete Site Map

### 1. PUBLIC PAGES (Marketing & Information)

#### Homepage
- `/home` - Canonical homepage (root `/` redirects here)

#### Product Pages
- `/how-it-works` - Platform overview and process
- `/for-patients` - Patient-focused value proposition
- `/for-specialists` - Specialist benefits and features
- `/for-clinics` - Clinic partnership information

#### Company Pages
- `/about` - Company information and mission
- `/about/careers` - Job opportunities
- `/blog` - Healthcare articles and updates
- `/contact` - Contact form and support

---

### 2. SEARCH & DISCOVERY

- `/search` → redirects to `/search/specialists`
- `/search/specialists` - Find healthcare specialists
- `/search/clinics` - Find medical facilities
- `/specialists/:id` - Specialist profile detail page
- `/book/:id` - Appointment booking flow

---

### 3. AUTHENTICATION

- `/auth` - Login and signup (with `?mode=signup` query param)

---

### 4. PATIENT PORTAL (`/patient/*`)

**Dashboard & Profile**
- `/patient/dashboard` - Patient main dashboard
- `/patient/profile` - Profile settings and personal info

**Appointments & Care**
- `/patient/appointments` - Appointment list
- `/patient/appointments/:id` - Appointment details
- `/patient/prescriptions` - Prescription history
- `/patient/medical-records` - Medical records library
- `/patient/medical-records/upload` - Upload new records

**Communication & Payments**
- `/patient/messages` - Secure messaging with providers
- `/patient/payments` - Payment history and billing

**Family & Favorites**
- `/patient/family-members` - Manage family member profiles
- `/patient/favorites` - Saved specialists and clinics
- `/patient/notifications` - Alerts and reminders

---

### 5. SPECIALIST PORTAL (`/specialist/*`)

**Dashboard & Profile**
- `/specialist/dashboard` - Specialist main dashboard
- `/specialist/profile` - Professional profile settings

**Schedule Management**
- `/specialist/availability` - Set working hours
- `/specialist/time-off` - Manage vacation and time off

**Patient Care**
- `/specialist/appointments` - Appointment calendar
- `/specialist/appointments/:id` - Appointment details
- `/specialist/prescriptions/create/:appointmentId` - Create prescription
- `/specialist/soap-notes/create/:appointmentId` - Document SOAP notes
- `/specialist/reviews/create/:appointmentId` - Request patient review

**Business Tools**
- `/specialist/messages` - Patient communication
- `/specialist/payments` - Earnings and payouts
- `/specialist/notifications` - Appointment alerts
- `/specialist/analytics` - Performance metrics

---

### 6. CLINIC PORTAL (`/clinic/*`)

**Management**
- `/clinic/dashboard` - Clinic main dashboard
- `/clinic/settings` - Clinic information and configuration
- `/clinic/staff` - Staff member management

**Operations**
- `/clinic/appointments` - Clinic-wide appointment view
- `/clinic/appointments/:id` - Appointment details
- `/clinic/messages` - Communication hub
- `/clinic/notifications` - System alerts
- `/clinic/analytics` - Clinic performance data

---

### 7. SHARED FEATURES

- `/consultation/:appointmentId` - Video consultation room (all user types)

---

### 8. ADMIN PORTAL (`/admin/*`)

- `/admin/dashboard` - System administration
- `/admin/audit-logs` - Security and activity logs
- `/admin/sessions` - User session management

---

### 9. LEGAL PAGES (`/legal/*`)

- `/legal/privacy` - Privacy policy
- `/legal/terms` - Terms of service
- `/legal/hipaa` - HIPAA compliance information
- `/legal/cookies` - Cookie policy

---

### 10. SYSTEM PAGES

- `/404` - Not found (catch-all `*` route)

---

## Legacy URL Redirects (301 Permanent)

All old URLs redirect to new structure:

### General Pages
- `/` → `/home`
- `/careers` → `/about/careers`
- `/privacy` → `/legal/privacy`
- `/terms` → `/legal/terms`
- `/hipaa` → `/legal/hipaa`
- `/cookies` → `/legal/cookies`

### Patient Portal (previously at root)
- `/dashboard` → `/patient/dashboard`
- `/profile` → `/patient/profile`
- `/appointments` → `/patient/appointments`
- `/prescriptions` → `/patient/prescriptions`
- `/medical-records` → `/patient/medical-records`
- `/messages` → `/patient/messages`
- `/payments` → `/patient/payments`
- `/family-members` → `/patient/family-members`
- `/favorites` → `/patient/favorites`
- `/notifications` → `/patient/notifications`

### Specialist Pages
- `/specialist/:id` → `/specialists/:id`

### Admin Pages
- `/admin` → `/admin/dashboard`
- `/audit-logs` → `/admin/audit-logs`
- `/sessions` → `/admin/sessions`
- `/analytics` → `/specialist/analytics`

---

## Navigation Structure

### Primary Navigation (Header)
Visible to all users:
- How It Works
- For Patients
- For Specialists
- For Clinics

### Authenticated User Menu (Dropdown)
Context-aware based on role:

**Patients:**
- Dashboard → `/patient/dashboard`
- Profile Settings → `/patient/profile`

**Specialists:**
- Dashboard → `/specialist/dashboard`
- Profile Settings → `/specialist/profile`

**Clinic Admins:**
- Dashboard → `/clinic/dashboard`
- Profile Settings → `/clinic/settings`

### Footer Navigation

**Product Column:**
- How It Works
- For Patients
- For Specialists
- For Clinics

**Company Column:**
- About Us
- Careers
- Blog
- Contact

**Legal Column:**
- Privacy Policy
- Terms of Service
- HIPAA Compliance
- Cookie Policy

---

## URL Conventions & Best Practices

### Patterns
- **Collections**: `/resource` (e.g., `/search/specialists`)
- **Detail pages**: `/resource/:id` (e.g., `/specialists/:id`)
- **Actions**: `/resource/action` (e.g., `/medical-records/upload`)
- **Nested actions**: `/resource/action/:id` (e.g., `/prescriptions/create/:appointmentId`)

### Rules
1. Always use kebab-case for multi-word slugs
2. Use plural for collections (`/specialists`), singular for detail (`/specialist/dashboard`)
3. Scope by user role for portal pages (`/patient/*`, `/specialist/*`, `/clinic/*`)
4. Keep admin and legal pages in clear namespaces (`/admin/*`, `/legal/*`)
5. Use descriptive, SEO-friendly slugs
6. Avoid IDs in URLs except for detail/action pages

---

## SEO Considerations

### Title Tag Format
`{Page Title} | DUNIAMED - Global Healthcare Marketplace`

### Meta Description Guidelines
- 150-160 characters
- Include primary keyword naturally
- Call-to-action where appropriate

### Priority Pages for SEO
1. `/home` - Homepage (highest priority)
2. `/search/specialists` - Main conversion funnel
3. `/for-patients`, `/for-specialists`, `/for-clinics` - Value propositions
4. `/about` - Trust and credibility
5. `/blog` - Content marketing

### Canonical Tags
- Set `/home` as canonical for homepage
- All portal pages should have self-referencing canonical tags
- Redirect versions (e.g., `/dashboard`) should not be indexed

---

## File Structure

```
src/
├── pages/
│   ├── HomePage.tsx              # /home
│   ├── HowItWorks.tsx           # /how-it-works
│   ├── ForPatients.tsx          # /for-patients
│   ├── ForSpecialists.tsx       # /for-specialists
│   ├── ForClinics.tsx           # /for-clinics
│   ├── About.tsx                # /about
│   ├── Careers.tsx              # /about/careers
│   ├── Blog.tsx                 # /blog
│   ├── Contact.tsx              # /contact
│   ├── Auth.tsx                 # /auth
│   ├── Search.tsx               # /search/specialists
│   ├── SearchClinics.tsx        # /search/clinics
│   ├── SpecialistProfile.tsx    # /specialists/:id
│   ├── BookAppointment.tsx      # /book/:id
│   ├── Dashboard.tsx            # /patient/dashboard
│   ├── Profile.tsx              # /patient|specialist/profile
│   ├── Appointments.tsx         # /patient|specialist|clinic/appointments
│   ├── AppointmentDetails.tsx   # /*/appointments/:id
│   ├── Prescriptions.tsx        # /patient/prescriptions
│   ├── CreatePrescription.tsx   # /specialist/prescriptions/create/:id
│   ├── MedicalRecords.tsx       # /patient/medical-records
│   ├── UploadMedicalRecord.tsx  # /patient/medical-records/upload
│   ├── Messages.tsx             # /*/messages
│   ├── VideoConsultation.tsx    # /consultation/:appointmentId
│   ├── Payments.tsx             # /*/payments
│   ├── FamilyMembers.tsx        # /patient/family-members
│   ├── Favorites.tsx            # /patient/favorites
│   ├── Notifications.tsx        # /*/notifications
│   ├── SpecialistDashboard.tsx  # /specialist/dashboard
│   ├── SpecialistAvailability.tsx # /specialist/availability
│   ├── SpecialistTimeOff.tsx    # /specialist/time-off
│   ├── CreateReview.tsx         # /specialist/reviews/create/:id
│   ├── CreateSOAPNote.tsx       # /specialist/soap-notes/create/:id
│   ├── Analytics.tsx            # /specialist|clinic/analytics
│   ├── ClinicDashboard.tsx      # /clinic/dashboard
│   ├── ClinicSettings.tsx       # /clinic/settings
│   ├── ClinicStaff.tsx          # /clinic/staff
│   ├── AdminPanel.tsx           # /admin/dashboard
│   ├── AuditLogs.tsx            # /admin/audit-logs
│   ├── SessionManagement.tsx    # /admin/sessions
│   ├── PrivacyPolicy.tsx        # /legal/privacy
│   ├── Terms.tsx                # /legal/terms
│   ├── HIPAACompliance.tsx      # /legal/hipaa
│   ├── CookiePolicy.tsx         # /legal/cookies
│   └── NotFound.tsx             # /404
```

---

## Implementation Notes

### Route Configuration
All routes are configured in `src/App.tsx` with:
- Direct routes for new structure
- `<Navigate>` redirects for legacy URLs
- Role-based dashboard routing in Header component

### Header Navigation
Dynamic dashboard/profile links based on user role:
- Checks `profile.role` from AuthContext
- Routes to appropriate portal section
- Handles specialist, clinic_admin, and patient roles

### Footer Navigation
Static links updated to use new URL structure.

---

## Future Considerations

### Localization
If adding locales:
```
/{locale}/home
/{locale}/search/specialists
/{locale}/patient/dashboard
```

### Additional Features
- `/resources` - Educational content hub
- `/community` - Patient/specialist forums
- `/marketplace` - Medical equipment/services
- `/insurance` - Insurance provider integrations

### Multi-tenancy
If supporting clinic-specific domains:
```
clinic.duniamed.com/home
clinic.duniamed.com/staff
```

---

## Maintenance Checklist

- [ ] Update sitemap.xml when adding new pages
- [ ] Add meta tags (title, description) to all new pages
- [ ] Test all redirects after deployment
- [ ] Monitor 404 errors in analytics
- [ ] Update robots.txt if needed
- [ ] Add structured data (JSON-LD) for key pages
- [ ] Set up canonical tags
- [ ] Create breadcrumbs for nested pages
- [ ] Test role-based navigation flows
- [ ] Validate all internal links

---

Last Updated: 2025-09-30
Version: 1.0.0
