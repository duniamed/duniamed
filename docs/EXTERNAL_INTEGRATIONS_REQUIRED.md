# External Integrations Required

This document lists all external integrations that require API keys, partnerships, or external setup.

## Payment & Financial

### Stripe
- **Status**: Partially configured
- **Required**: Production API keys, Connect setup for marketplace
- **Setup**: Already enabled in Supabase secrets
- **Remaining**: Multi-currency config, Connect onboarding

### Regional Payment Processors
- **UAE**: Network International, CashU (Islamic banking)
- **South Korea**: KG Inicis, NHN KCP, Kakao Pay, Naver Pay
- **Malaysia**: iPay88, eGHL, Touch 'n Go, Boost, GrabPay, FPX
- **Indonesia**: Midtrans, Xendit, Dana, OVO, GoPay, QRIS
- **Uruguay**: Local processors (PagosOnline, RedPagos)
- **Costa Rica**: BAC Credomatic, SINPE Móvil

**Priority**: HIGH
**Timeline**: Required before regional launches

## Healthcare Integrations

### Insurance & Eligibility (USA)
- **Change Healthcare**: Trading partner ID, API keys
- **Optum**: Developer account, credentials
- **Availity**: Organization setup, clearinghouse connection
- **Status**: Mocked, needs real credentials

**Priority**: CRITICAL for US launch
**Setup Steps**:
1. Register as trading partner
2. Obtain NPIs and taxonomy codes
3. Complete connectivity testing
4. Go through certification process

### EHR/EMR Systems
- **Epic**: MyChart integration, App Orchard registration
- **Cerner**: Code Console account, API keys
- **athenahealth**: Developer portal access
- **eClinicalWorks**: API credentials
- **Status**: Framework ready, needs credentials

**Priority**: HIGH
**Setup Steps**:
1. Register with vendor developer programs
2. Complete security reviews
3. Obtain sandbox access
4. Implement and test FHIR R4 endpoints
5. Go through production certification

### Health Information Exchanges (HIE)
- **CommonWell**: Membership required
- **Carequality**: Framework participant agreement
- **eHealth Exchange**: Authorization required
- **Status**: Not started

**Priority**: MEDIUM
**Timeline**: 6-12 months

## Credentialing & Verification

### Primary Source Verification
- **FSMB** (Federation of State Medical Boards): API access
- **ABMS** (American Board of Medical Specialties): Verification API
- **AMA** (American Medical Association): Masterfile access
- **NPDB** (National Practitioner Data Bank): Querier credentials
- **OIG/SAM.gov**: Automated screening API
- **Status**: Not configured

**Priority**: CRITICAL for provider onboarding
**Setup Steps**:
1. Register organization with each entity
2. Complete eligibility verification
3. Obtain API credentials
4. Set up continuous monitoring

### Background Checks
- **Checkr**: Enterprise account needed
- **Sterling**: API integration
- **Status**: Not integrated

**Priority**: HIGH

### International Credentialing
- **Brazil**: CRM per state (27 regional councils)
- **UAE**: DHCC, DHA, DOH verification APIs
- **South Korea**: MOHW verification system
- **Malaysia**: MMC verification portal
- **Indonesia**: KKI verification
- **Status**: Not started

**Priority**: HIGH for international expansion
**Timeline**: Per-country rollout schedule

## Communication & Notifications

### Twilio (WhatsApp, SMS)
- **Status**: Configured
- **Secrets**: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- **Remaining**: Production number verification, template approval

### ElevenLabs (Text-to-Speech)
- **Status**: Not configured
- **Required**: Production API key
- **Use Case**: Multi-language voice assistance
- **Priority**: MEDIUM

**Setup Steps**:
1. Create ElevenLabs account
2. Select voice models
3. Add API key to Supabase secrets
4. Configure voice preferences per locale

### Resend (Email)
- **Status**: Configured
- **Secret**: RESEND_API_KEY
- **Remaining**: Domain verification, production limits increase

## Telehealth & Video

### Daily.co
- **Status**: Configured
- **Secret**: DAILY_API_KEY
- **Remaining**: Production plan upgrade, recording storage config

**Priority**: HIGH

## Calendar & Scheduling

### Google Calendar
- **Status**: OAuth flow implemented
- **Required**: Production OAuth consent screen approval
- **Setup**: Google Cloud Platform project configured

### Microsoft Outlook
- **Status**: Partial implementation
- **Required**: Azure AD app registration, production permissions

### Apple Calendar (CalDAV)
- **Status**: Not implemented
- **Required**: Apple Developer account, CalDAV server config
- **Priority**: MEDIUM

**Setup Steps**:
1. Register Apple Developer account ($99/year)
2. Configure CalDAV authentication
3. Test with managed devices
4. Document enrollment for enterprise customers

## Business & Marketing

### Google Business Profile API
- **Status**: Basic sync implemented
- **Required**: 
  - Google Cloud project with Business Profile API enabled
  - OAuth 2.0 credentials
  - API quota increase for production
- **Features Needed**:
  - Location verification
  - Photo uploads with attribution
  - Review management
  - Q&A sync (deprecating Nov 2025 - feature flag)
  - Analytics integration

**Priority**: HIGH for clinics
**Setup Steps**:
1. Enable Business Profile API in Google Cloud
2. Configure OAuth consent screen
3. Request quota increase
4. Implement location verification flow
5. Add feature flag for Q&A deprecation

### DocuSign
- **Status**: Basic integration
- **Required**: Enterprise account, bulk send templates
- **Remaining**: Template library setup, bulk operations

**Priority**: MEDIUM

## Remote Patient Monitoring (RPM)

### Terra API
- **Status**: OAuth framework ready
- **Required**: Production API keys
- **Devices**: Fitbit, Withings, Oura, Apple Health

### Fitbit Direct
- **Status**: Not configured
- **Required**: Developer app registration

### Withings
- **Status**: Not configured  
- **Required**: Partner API access

**Priority**: MEDIUM
**Use Case**: Chronic condition monitoring

## Monitoring & Observability

### NewRelic
- **Status**: Framework ready
- **Required**: Account, license key, APM configuration
- **Features Needed**:
  - Custom events
  - Alert policies
  - Dashboards
  - Error tracking

**Priority**: HIGH for production
**Setup Steps**:
1. Create NewRelic account
2. Add license key to secrets
3. Configure custom events
4. Set up alert policies
5. Build dashboards

### Sentry (Alternative)
- **Status**: Not configured
- **Priority**: HIGH (choose NewRelic OR Sentry)

## Regional Compliance Systems

### USA
- **PDMP** (Prescription Drug Monitoring): Per-state registration
- **Medicare/Medicaid**: NPI, PECOS enrollment
- **Status**: Framework ready

### Brazil
- **TISS**: Submission endpoint configuration
- **RNDS**: National health data network
- **Status**: Framework ready

### UAE
- **NABIDH**: Dubai health data platform
- **Malaffi**: Abu Dhabi HIE
- **SHERYAN**: Sharjah health network
- **Status**: Not started

### South Korea
- **HIRA**: Health Insurance Review & Assessment
- **Status**: Not started

### Malaysia
- **MyHEALTH**: National health portal integration
- **MySejahtera**: Contact tracing integration
- **Status**: Not started

### Indonesia
- **SATUSEHAT**: National health platform
- **BPJS**: Social security integration
- **Status**: Not started

**Priority**: CRITICAL per country launch
**Timeline**: Staged with regional rollouts

## Implementation Priority Matrix

### Phase 1 (Immediate - 0-1 month)
1. Insurance eligibility APIs (Change Healthcare/Optum)
2. Primary source verification (FSMB, ABMS, NPDB)
3. NewRelic/Sentry monitoring
4. Stripe production configuration

### Phase 2 (Short-term - 1-3 months)
1. EHR integrations (Epic, Cerner)
2. Google Business Profile full features
3. Background check providers
4. CalDAV for Apple Calendar
5. ElevenLabs TTS

### Phase 3 (Medium-term - 3-6 months)
1. HIE integrations (CommonWell, Carequality)
2. Regional payment processors (per country)
3. RPM device ecosystem (Terra, Fitbit, Withings)
4. Regional compliance systems (staged rollout)

### Phase 4 (Long-term - 6-12 months)
1. Additional EHR systems
2. Remaining regional integrations
3. Advanced analytics integrations
4. Specialty-specific integrations

## Contact Information & Next Steps

For each integration:
1. Review vendor documentation
2. Register developer account
3. Complete security review if required
4. Obtain sandbox credentials
5. Implement and test
6. Request production access
7. Add credentials to Supabase secrets
8. Deploy and monitor

**Note**: Many integrations require business agreements, compliance reviews, and certification processes that can take weeks to months. Start high-priority integrations immediately.
