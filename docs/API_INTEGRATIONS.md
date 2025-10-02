# External API Integrations Guide

This document outlines the required third-party API integrations for clinical workflows and how to configure them.

## Overview

The platform integrates with several external healthcare APIs to enable:
- **E-Prescriptions**: Pharmacy routing via Surescripts/NCPDP
- **Insurance Eligibility**: Real-time verification via Change Healthcare/Optum
- **Lab/Imaging Orders**: LIS/RIS integration via FHIR/HL7
- **Remote Patient Monitoring**: Device data via Fitbit, Terra, Withings APIs

## 1. E-Prescriptions (Surescripts/NCPDP)

### Purpose
Route electronic prescriptions directly to pharmacies using NCPDP SCRIPT 2023 standard.

### Required Credentials
```bash
SURESCRIPTS_API_KEY=your_api_key
SURESCRIPTS_NCPDP_ID=your_ncpdp_id
```

### Integration Steps
1. **Register with Surescripts**: Apply at https://surescripts.com/
2. **Get NCPDP ID**: Obtain your provider NCPDP identifier
3. **Certification**: Complete NCPDP 2023 Upgrade certification
4. **Configure Edge Function**: Add credentials to Supabase secrets

### API Endpoints
- Production: `https://api.surescripts.com/messaging/v1/messages`
- Sandbox: `https://api-test.surescripts.com/messaging/v1/messages`

### Message Format
Uses NCPDP SCRIPT XML standard (270/271 transactions):
- **NEWRX**: New prescription
- **REFRES**: Refill response
- **RXCHG**: Prescription change
- **CANRX**: Cancel prescription

### Edge Function
- **Function**: `send-prescription`
- **Triggered by**: Prescription creation in UI
- **Output**: Pharmacy confirmation + accession number

---

## 2. Insurance Eligibility (Change Healthcare/Optum)

### Purpose
Real-time insurance eligibility verification and benefit checking.

### Required Credentials
```bash
CLEARINGHOUSE_API_KEY=your_api_key
CLEARINGHOUSE_URL=https://api.changehealthcare.com/medicalnetwork/eligibility/v3
```

### Integration Steps
1. **Sign Up**: Register at https://developers.changehealthcare.com/
2. **Get API Key**: Generate production API credentials
3. **Configure Trading Partners**: Set up payer connections
4. **Test Environment**: Use sandbox for development

### API Format
Uses X12 EDI 270/271 transactions converted to JSON:
```json
{
  "controlNumber": "20250102120000",
  "tradingPartnerServiceId": "PAYER_ID",
  "provider": { "npi": "1234567890" },
  "subscriber": {
    "memberId": "ABC123456",
    "dateOfBirth": "1990-01-01"
  },
  "encounter": {
    "serviceTypeCodes": ["30"]
  }
}
```

### Response Data
- Eligibility status (active/inactive)
- Coverage details (plan type, effective dates)
- Cost-sharing: copays, deductibles, out-of-pocket max
- Service-specific coverage

### Edge Function
- **Function**: `check-eligibility`
- **Already Implemented**: ✅ Needs real API connection
- **Triggered by**: Booking flow, patient portal

---

## 3. Lab/Imaging Orders (FHIR HL7)

### Purpose
Submit lab and imaging orders to LIS/RIS systems using FHIR R4.

### Required Credentials
```bash
LIS_API_KEY=your_api_key
LIS_FHIR_ENDPOINT=https://your-lis-provider.com/fhir/r4
```

### Supported Vendors
- **Cerner**: https://fhir.cerner.com/
- **Epic**: https://open.epic.com/
- **LabCorp**: https://developer.labcorp.com/
- **Quest Diagnostics**: https://developer.questdiagnostics.com/

### Integration Steps
1. **Choose Vendor**: Select LIS/RIS provider
2. **FHIR Certification**: Complete vendor-specific certification
3. **API Access**: Get production FHIR endpoint + credentials
4. **Test Orders**: Use sandbox to validate workflows

### FHIR Resources Used
- **ServiceRequest**: Lab/imaging orders
- **DiagnosticReport**: Results
- **Observation**: Individual test results
- **Patient**: Demographics
- **Practitioner**: Ordering provider

### ServiceRequest Example
```json
{
  "resourceType": "ServiceRequest",
  "status": "active",
  "intent": "order",
  "category": [{
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "108252007",
      "display": "Laboratory procedure"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "2345-7",
      "display": "Glucose [Mass/volume] in Serum or Plasma"
    }]
  },
  "subject": { "reference": "Patient/123" },
  "requester": { "reference": "Practitioner/456" }
}
```

### Edge Function
- **Function**: `submit-lab-order`
- **Triggered by**: Lab order creation in dashboard
- **Output**: Accession number + order status

---

## 4. Remote Patient Monitoring (RPM)

### Purpose
Connect wearable devices and health sensors to pull patient vitals.

### Supported Providers

#### A. Terra API (Recommended - Multi-device aggregator)
```bash
TERRA_API_KEY=your_api_key
TERRA_DEV_ID=your_dev_id
```
- **Website**: https://tryterra.co/
- **Supports**: Fitbit, Apple Health, Google Fit, Garmin, Oura, Whoop
- **Endpoint**: `https://api.tryterra.co/v2`
- **Benefits**: Single integration for multiple devices

#### B. Fitbit API (Direct)
```bash
FITBIT_CLIENT_ID=your_client_id
FITBIT_CLIENT_SECRET=your_client_secret
```
- **Website**: https://dev.fitbit.com/
- **OAuth Flow**: Required for user authorization
- **Endpoint**: `https://api.fitbit.com/1`
- **Data**: Heart rate, steps, sleep, weight, blood pressure

#### C. Withings API
```bash
WITHINGS_CLIENT_ID=your_client_id
WITHINGS_CLIENT_SECRET=your_client_secret
```
- **Website**: https://developer.withings.com/
- **Devices**: Smart scales, blood pressure monitors
- **Endpoint**: `https://wbsapi.withings.net`

#### D. Apple Health (iOS only)
- Requires native iOS app integration
- Uses HealthKit framework
- Data posted from app to edge function

### Integration Steps
1. **Register App**: Create developer account with provider
2. **OAuth Setup**: Configure redirect URIs for device authorization
3. **Device Connection**: User authorizes device access via OAuth
4. **Data Sync**: Automatic or manual sync pulls latest readings
5. **Threshold Alerts**: Configure clinical thresholds for alerts

### Data Types
- **Vitals**: Heart rate, blood pressure, SpO2, temperature
- **Activity**: Steps, distance, active minutes, calories
- **Sleep**: Duration, quality, stages
- **Weight**: Body composition, BMI
- **Glucose**: Blood sugar levels (CGM devices)

### OAuth Flow
```
1. User clicks "Connect Device"
2. Redirect to provider OAuth page
3. User authorizes access
4. Provider redirects back with code
5. Edge function exchanges code for token
6. Store encrypted token in database
7. Begin automatic syncing
```

### Edge Functions
- **`oauth-rpm-connect`**: Handle OAuth callbacks, register devices
- **`sync-rpm-devices`**: Pull latest readings from devices
- **Triggered by**: Scheduled cron job (every 15 minutes) + manual sync

---

## Database Schema

### Tables Created
```sql
-- Prescription transmissions
prescription_transmissions (
  id, prescription_id, pharmacy_ncpdp_id,
  transmission_status, ncpdp_message, transmission_date
)

-- Lab order transmissions  
lab_order_transmissions (
  id, lab_order_id, transmission_status,
  fhir_request, accession_number, transmitted_at
)

-- RPM device authentication
rpm_device_auth (
  id, user_id, device_id, provider,
  access_token, refresh_token, token_expires_at
)

-- RPM alerts
rpm_alerts (
  id, user_id, device_id, alert_type,
  severity, message, reading_id, created_at
)
```

---

## Security Considerations

### Credentials Management
- **Never hardcode** API keys in code
- Store all credentials in **Supabase Secrets**
- Use **environment variables** in edge functions
- Rotate credentials regularly

### Data Encryption
- OAuth tokens encrypted at rest
- HTTPS/TLS for all API communications
- PHI data follows HIPAA encryption standards

### Access Control
- Device auth tied to specific user accounts
- RLS policies prevent cross-user data access
- Audit logs track all API calls

---

## Testing & Certification

### Sandbox Environments
All providers offer sandbox/test environments:
- **Surescripts**: Test pharmacy routing
- **Change Healthcare**: Mock payer responses
- **FHIR Servers**: Test lab orders
- **Device APIs**: Simulated device data

### Production Readiness
Before going live:
1. ✅ Complete vendor certification programs
2. ✅ Test full workflows in sandbox
3. ✅ Verify error handling and retries
4. ✅ Set up monitoring and alerts
5. ✅ Document incident response procedures

---

## Cost Estimates

### Transaction Fees (Approximate)
- **Surescripts**: $0.05-0.15 per prescription
- **Change Healthcare**: $0.10-0.25 per eligibility check
- **FHIR Lab Orders**: Varies by vendor ($0.50-2.00)
- **Terra API**: $0.01-0.05 per user/month
- **Fitbit Direct**: Free (OAuth only)

### Monitoring Costs
- Edge function invocations: Included in Supabase
- Database storage: ~1MB per 1000 readings
- API rate limits: Varies by plan

---

## Support & Documentation

### Official Docs
- [Surescripts Developer Portal](https://surescripts.com/developers)
- [Change Healthcare API Docs](https://developers.changehealthcare.com/)
- [HL7 FHIR Specification](https://www.hl7.org/fhir/)
- [Terra API Documentation](https://docs.tryterra.co/)
- [Fitbit Web API](https://dev.fitbit.com/build/reference/web-api/)

### Implementation Support
For integration help, contact:
- Vendor support teams (each provides technical support)
- HL7/FHIR community forums
- Healthcare IT integration consultants

---

## Next Steps

1. **Choose Providers**: Select vendors based on requirements
2. **Register Apps**: Create developer accounts
3. **Add Secrets**: Configure API credentials in Supabase
4. **Test Functions**: Use sandbox environments
5. **Certify**: Complete vendor certification processes
6. **Go Live**: Enable production endpoints
