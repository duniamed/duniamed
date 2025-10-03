# Multi-Jurisdiction Healthcare Compliance Framework

## Overview
This document maps Eudunia's compliance requirements across 9 jurisdictions: USA (HIPAA), Brazil (LGPD), EU (GDPR), UAE, South Korea, Uruguay, Costa Rica, Malaysia, and Indonesia.

---

## 1. United States (HIPAA) - ✅ IMPLEMENTED

### Requirements
- **PHI Protection**: Encrypt all Protected Health Information at rest and in transit
- **Access Controls**: Role-based access with audit trails
- **Breach Notification**: 60-day notification requirement
- **Business Associate Agreements**: Required for all third-party vendors
- **Patient Rights**: Access, amendment, accounting of disclosures

### Implementation Status
- ✅ AES-256 encryption for data at rest
- ✅ TLS 1.3 for data in transit
- ✅ Audit logging with immutable trails
- ✅ MFA and biometric authentication
- ✅ Breach notification workflows
- ✅ Patient data access portals

### Compliance Documentation
- `src/pages/HIPAACompliance.tsx` - Public compliance page
- `supabase/migrations/*` - Database with RLS policies
- `src/components/PrivacyDashboard.tsx` - Patient privacy controls

---

## 2. Brazil (LGPD - Lei Geral de Proteção de Dados) - ✅ IMPLEMENTED

### Requirements
- **Data Localization**: Personal data of Brazilian residents must be stored in Brazil
- **Consent Management**: Explicit opt-in required
- **Right to Deletion**: 30-day response time
- **Data Processing Registry**: Maintain records of all processing activities
- **Data Protection Officer**: Mandatory DPO appointment

### Implementation Status
- ✅ Supabase regional deployments (São Paulo region)
- ✅ Consent management system (`consent_records` table)
- ✅ Data deletion workflows
- ✅ Audit logs for processing activities
- ⚠️ DPO appointment required (organizational, not technical)

### Compliance Documentation
- Database tables: `consent_records`, `audit_logs`, `data_access_logs`
- `src/components/ConsentGate.tsx` - Consent collection
- `src/pages/PrivacyCenter.tsx` - User privacy management

---

## 3. European Union (GDPR) - ✅ IMPLEMENTED

### Requirements
- **Data Minimization**: Collect only necessary data
- **Right to Portability**: Machine-readable export format
- **Right to Erasure**: "Right to be forgotten"
- **Data Processing Agreements**: Required with all processors
- **72-Hour Breach Notification**: To supervisory authority
- **Privacy by Design**: Default privacy settings

### Implementation Status
- ✅ Minimal data collection practices
- ✅ FHIR-compliant data export (`src/pages/DataExport.tsx`)
- ✅ Anonymization and deletion workflows
- ✅ Breach detection and notification automation
- ✅ Privacy-first default settings

### Compliance Documentation
- `src/pages/PrivacyPolicy.tsx` - GDPR-compliant privacy notice
- `supabase/functions/generate-export/index.ts` - Data portability
- EU data center deployment via Supabase (Frankfurt/London regions)

---

## 4. United Arab Emirates (UAE) - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Dubai Healthcare City (DHCC) Regulations**: Healthcare provider licensing
- **Federal Law No. 2 of 2019**: Personal data protection
- **Telemedicine Guidelines**: Ministry of Health approval required
- **Data Residency**: Preference for UAE-based storage
- **Arabic Language Support**: Medical records and consent forms
- **Sharia-Compliant Practices**: Cultural sensitivity in care delivery

### Implementation Gaps
- ❌ Arabic language localization (only EN, ES, PT, FR, DE currently)
- ❌ UAE data center deployment (requires Supabase or custom setup)
- ❌ DHCC-specific consent forms
- ❌ Islamic calendar integration for appointments
- ❌ Gender-specific provider matching (cultural requirement)

### Required Actions
1. **Language Support**:
   - Add Arabic (`ar`) to i18n configuration
   - RTL (right-to-left) layout support
   - Translate all patient-facing content

2. **Data Residency**:
   - Deploy Supabase instance in UAE region OR
   - Use UAE-based infrastructure provider

3. **Regulatory Compliance**:
   - Obtain telemedicine license from UAE Ministry of Health
   - Register with Dubai Healthcare City Authority
   - Implement Sharia-compliant payment options

4. **Cultural Adaptations**:
   - Gender preference in provider search
   - Prayer time accommodations in scheduling
   - Halal certification for medications (if applicable)

### Code Changes Required
```typescript
// src/lib/i18n.ts - Add Arabic
import arTranslations from './locales/ar.json';

i18n.init({
  resources: {
    // ... existing languages
    ar: { translation: arTranslations },
  },
  // ... rest of config
});

// tailwind.config.ts - Add RTL support
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
};
```

---

## 5. South Korea - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Personal Information Protection Act (PIPA)**: Korean GDPR equivalent
- **Medical Service Act**: Telemedicine restrictions (limited to remote areas)
- **Health Insurance Review & Assessment Service (HIRA)**: Integration required
- **Data Localization**: Personal data must be stored in Korea
- **Korean Language**: All services must be available in Korean
- **Resident Registration Number (RRN) Protection**: Special encryption

### Implementation Gaps
- ❌ Korean language support (`ko` locale)
- ❌ Korea data center deployment
- ❌ HIRA integration (national health insurance)
- ❌ RRN encryption and validation
- ❌ Telemedicine geographic restrictions

### Required Actions
1. **Language Support**:
   - Add Korean translations to all locales
   - Korean-specific date/time formats

2. **Data Localization**:
   - Deploy in Seoul AWS/Google Cloud region
   - Ensure all personal data stays in-country

3. **Insurance Integration**:
   - Integrate with HIRA API for claims
   - Support Korean National Health Insurance cards
   - Implement Korean medical coding standards

4. **Identity Verification**:
   - RRN validation with special encryption
   - Alternative identity verification (foreigner ID)
   - Mobile carrier authentication (PASS app)

5. **Telemedicine Compliance**:
   - Verify patient location (remote area confirmation)
   - Restrict services to compliant regions
   - Partner with licensed Korean healthcare facilities

### Code Changes Required
```typescript
// Add Korean locale
import koTranslations from './locales/ko.json';

// Implement RRN validation
function validateKoreanRRN(rrn: string): boolean {
  // 13-digit format: YYMMDD-GNNNNNN
  // Special validation algorithm required
}

// Geographic restrictions
async function verifyKoreanLocation(latitude: number, longitude: number): Promise<boolean> {
  // Check if location is in approved remote area
}
```

---

## 6. Uruguay - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Law 18.331**: Personal data protection (GDPR-aligned)
- **Law 18.335**: Patient rights and health data
- **Spanish Language**: Primary language requirement
- **AGESIC Compliance**: Government data protection authority
- **Electronic Health Record (EHR) Standards**: National interoperability

### Implementation Gaps
- ✅ Spanish language support (already implemented)
- ❌ Uruguay data residency preference
- ❌ AGESIC registration
- ❌ National EHR integration
- ❌ Uruguay-specific consent forms

### Required Actions
1. **Data Protection**:
   - Register with AGESIC (Uruguayan data protection authority)
   - Implement Uruguay-specific privacy notices
   - 15-day breach notification timeline

2. **Healthcare Integration**:
   - Integrate with Historia Clínica Electrónica Nacional (HCEN)
   - Support Uruguayan health insurance (FONASA, mutualistas)
   - Implement Uruguayan medical record standards

3. **Payment Systems**:
   - Support Uruguayan payment methods (RedPagos, Abitab)
   - Multi-currency: UYU (Uruguayan Peso)

### Code Changes Required
```typescript
// Already has Spanish, needs Uruguay-specific adaptations
const uruguayConfig = {
  currency: 'UYU',
  timezone: 'America/Montevideo',
  dateFormat: 'DD/MM/YYYY',
  insuranceProviders: ['FONASA', 'Mutualista', 'Private'],
};
```

---

## 7. Costa Rica - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Law 8968**: Patient rights and informed consent
- **CCSS Integration**: Caja Costarricense de Seguro Social (national insurance)
- **Spanish Language**: Required for all patient interactions
- **Data Protection Law 8968**: Privacy and data security
- **Telemedicine Regulations**: College of Physicians oversight

### Implementation Gaps
- ✅ Spanish language support (already implemented)
- ❌ CCSS integration
- ❌ Costa Rica data residency
- ❌ Colegio de Médicos y Cirujanos registration
- ❌ Costa Rica-specific consent forms

### Required Actions
1. **Professional Licensing**:
   - Register specialists with Colegio de Médicos y Cirujanos
   - Validate Costa Rican medical licenses (código médico)
   - Implement continuing education tracking

2. **Insurance Integration**:
   - CCSS patient verification
   - Private insurance provider integration (INS, others)
   - Co-payment calculation

3. **Regulatory Compliance**:
   - Telemedicine protocol approval
   - Data protection registration
   - Emergency care protocols (Cruz Roja integration)

### Code Changes Required
```typescript
const costaRicaConfig = {
  currency: 'CRC',
  timezone: 'America/Costa_Rica',
  insuranceTypes: ['CCSS', 'INS', 'Private'],
  emergencyNumber: '911',
};

// License validation
async function validateCostaRicanMedicalLicense(codigo: string): Promise<boolean> {
  // Call Colegio de Médicos API
}
```

---

## 8. Malaysia - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Personal Data Protection Act (PDPA) 2010**: Data privacy law
- **Private Healthcare Facilities and Services Act 1998**: Healthcare licensing
- **Telemedicine Guidelines**: Malaysian Medical Council oversight
- **MyHEALTH Portal Integration**: National health record system
- **Multi-Language Support**: Malay (primary), English, Mandarin, Tamil
- **Islamic Finance Compliance**: For payment processing

### Implementation Gaps
- ❌ Malay language support (`ms` locale)
- ❌ Mandarin Chinese (`zh` locale) and Tamil (`ta` locale)
- ❌ Malaysia data residency
- ❌ MyHEALTH integration
- ❌ Malaysian Medical Council registration
- ❌ Islamic finance payment options

### Required Actions
1. **Language Support**:
   - Add Bahasa Malaysia (Malay) translations
   - Add Mandarin Chinese for Chinese-speaking population
   - Add Tamil for Indian-Malaysian population
   - Multi-language consent forms

2. **Data Compliance**:
   - Deploy in Malaysia data center (Kuala Lumpur region)
   - Register with Personal Data Protection Commissioner
   - PDPA-compliant privacy notices

3. **Healthcare Integration**:
   - MyHEALTH portal integration for patient records
   - Malaysian Medical Council license verification
   - Integration with MySejahtera (health tracking app)
   - EPF (Employees Provident Fund) health claims

4. **Payment Systems**:
   - Islamic banking integration (shariah-compliant)
   - Support for Malaysian Ringgit (MYR)
   - Touch 'n Go, Boost, GrabPay integration

5. **Cultural Considerations**:
   - Halal certification for medications
   - Prayer time accommodations
   - Gender-sensitive care options

### Code Changes Required
```typescript
// Add multiple languages
import msTranslations from './locales/ms.json'; // Malay
import zhTranslations from './locales/zh.json'; // Mandarin
import taTranslations from './locales/ta.json'; // Tamil

const malaysiaConfig = {
  currency: 'MYR',
  timezone: 'Asia/Kuala_Lumpur',
  languages: ['ms', 'en', 'zh', 'ta'],
  insuranceProviders: ['EPF', 'MySalam', 'Private'],
  paymentMethods: ['Islamic Banking', 'TouchNGo', 'Boost', 'GrabPay'],
};
```

---

## 9. Indonesia - ⚠️ PARTIAL IMPLEMENTATION

### Requirements
- **Law No. 27/2022**: Personal Data Protection (effective Oct 2024)
- **Health Law No. 36/2009**: Healthcare service standards
- **Telemedicine Regulation**: Ministry of Health Circular 2020
- **Indonesian Language**: Bahasa Indonesia required
- **Data Localization**: Personal data must be stored in Indonesia
- **BPJS Kesehatan Integration**: National health insurance
- **Islamic Finance Compliance**: For payment processing

### Implementation Gaps
- ❌ Indonesian language support (`id` locale)
- ❌ Indonesia data residency (Jakarta region)
- ❌ BPJS Kesehatan integration
- ❌ Indonesian Medical Council (KKI) registration
- ❌ Halal certification tracking
- ❌ Islamic finance payment options

### Required Actions
1. **Language Support**:
   - Add Bahasa Indonesia translations
   - Indonesian date/time formats
   - Local medical terminology

2. **Data Compliance**:
   - Deploy in Jakarta data center
   - Register with Ministry of Communication (Kominfo)
   - Implement new PDP Law requirements (effective 2024)
   - Data breach notification (3 days)

3. **Healthcare Integration**:
   - BPJS Kesehaten (national health insurance) verification
   - KKI (Indonesian Medical Council) license validation
   - Integration with SATUSEHAT (national health platform)
   - COVID-19 vaccination certificate (PeduliLindungi)

4. **Payment Systems**:
   - Support Indonesian Rupiah (IDR)
   - Islamic banking integration (Bank Syariah)
   - E-wallet support (GoPay, OVO, Dana, ShopeePay)
   - QRIS (Indonesian QR payment standard)

5. **Cultural Considerations**:
   - Halal medication tracking
   - Prayer time scheduling
   - Ramadan fasting accommodations
   - Gender-sensitive care options

### Code Changes Required
```typescript
// Add Indonesian locale
import idTranslations from './locales/id.json';

const indonesiaConfig = {
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  insuranceProviders: ['BPJS Kesehatan', 'BPJS Ketenagakerjaan', 'Private'],
  paymentMethods: ['Islamic Banking', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'QRIS'],
  vaccinationIntegration: 'PeduliLindungi',
};

// License validation
async function validateIndonesianMedicalLicense(str: string): Promise<boolean> {
  // Call KKI API for license verification
}

// BPJS integration
async function verifyBPJSEligibility(cardNumber: string): Promise<EligibilityResponse> {
  // Call BPJS Kesehatan API
}
```

---

## Implementation Priority Matrix

| Country | Language Required | Data Residency | Insurance Integration | Priority | Effort |
|---------|------------------|----------------|----------------------|----------|--------|
| USA     | ✅ English       | ✅ Implemented | Partial (Stripe)     | DONE     | -      |
| Brazil  | ✅ Portuguese    | ✅ Implemented | Partial              | DONE     | -      |
| EU      | ✅ Multi         | ✅ Implemented | Partial              | DONE     | -      |
| UAE     | ❌ Arabic        | ❌ Required    | ❌ Required          | HIGH     | 4 weeks|
| S. Korea| ❌ Korean        | ❌ Required    | ❌ HIRA Required     | HIGH     | 6 weeks|
| Malaysia| ❌ Malay/Multi   | ❌ Required    | ❌ MyHEALTH          | MEDIUM   | 5 weeks|
| Indonesia| ❌ Indonesian   | ❌ Required    | ❌ BPJS Required     | MEDIUM   | 5 weeks|
| Uruguay | ✅ Spanish       | Preferred      | ❌ FONASA            | LOW      | 2 weeks|
| Costa Rica| ✅ Spanish     | Preferred      | ❌ CCSS              | LOW      | 2 weeks|

---

## Next Steps for Full Compliance

### Phase 1: Language Localization (2-3 weeks)
1. Create translation files for:
   - Arabic (`ar.json`) - UAE
   - Korean (`ko.json`) - South Korea
   - Malay (`ms.json`) - Malaysia
   - Mandarin (`zh.json`) - Malaysia
   - Tamil (`ta.json`) - Malaysia
   - Indonesian (`id.json`) - Indonesia

2. Implement RTL support for Arabic
3. Add language switcher to all pages
4. Translate all static content and UI elements

### Phase 2: Data Residency (3-4 weeks)
1. Deploy Supabase instances in:
   - Dubai/UAE region
   - Seoul region (South Korea)
   - Jakarta region (Indonesia)
   - Kuala Lumpur region (Malaysia)

2. Implement data routing logic based on user location
3. Set up cross-region replication for disaster recovery
4. Configure region-specific RLS policies

### Phase 3: Insurance & Healthcare Integrations (6-8 weeks)
1. **UAE**: DHCC registration, telemedicine licensing
2. **South Korea**: HIRA API integration, PASS authentication
3. **Malaysia**: MyHEALTH integration, EPF claims
4. **Indonesia**: BPJS Kesehatan API, SATUSEHAT integration
5. **Uruguay**: HCEN integration, AGESIC registration
6. **Costa Rica**: CCSS integration, Colegio de Médicos

### Phase 4: Payment System Localization (2-3 weeks)
1. Add currency support: AED, KRW, MYR, IDR, UYU, CRC
2. Integrate local payment methods:
   - Islamic banking (UAE, Malaysia, Indonesia)
   - E-wallets (Indonesia, Malaysia)
   - Local payment networks (Uruguay, Costa Rica)

### Phase 5: Cultural Adaptations (2-3 weeks)
1. Islamic calendar support (UAE, Malaysia, Indonesia)
2. Prayer time scheduling
3. Gender-preference matching
4. Halal medication tracking
5. Ramadan/fasting accommodations

### Phase 6: Legal & Regulatory (Ongoing)
1. Obtain telemedicine licenses in each jurisdiction
2. Register with data protection authorities
3. Professional licensing validation
4. Legal entity formation (where required)
5. Insurance provider partnerships

---

## Compliance Monitoring & Maintenance

### Quarterly Reviews
- Update translations for new features
- Review regulatory changes in each jurisdiction
- Audit data residency compliance
- Test insurance integrations
- Renew licenses and certifications

### Annual Audits
- Third-party security assessment
- Data protection impact assessments (DPIA)
- Penetration testing
- Compliance certification renewals
- Staff training and awareness programs

---

## Contact & Resources

### Regulatory Authorities
- **USA**: HHS Office for Civil Rights (HIPAA)
- **Brazil**: ANPD (National Data Protection Authority)
- **EU**: EDPB (European Data Protection Board)
- **UAE**: Dubai Healthcare City Authority
- **South Korea**: PIPC (Personal Information Protection Commission)
- **Malaysia**: Personal Data Protection Commissioner
- **Indonesia**: Kominfo (Ministry of Communication)
- **Uruguay**: AGESIC
- **Costa Rica**: Colegio de Médicos y Cirujanos

### Technical Partners
- Supabase: Regional deployments
- Stripe/Adyen: Multi-currency payments
- Translation services: Professional medical translators
- Legal counsel: Healthcare compliance attorneys in each jurisdiction

---

**Last Updated**: 2025-10-03  
**Next Review**: 2026-01-03  
**Version**: 1.0
