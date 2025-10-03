# Healthcare Platform API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints and edge functions in the Healthcare Platform.

**Base URL**: `https://knybxihimqrqwzkdeaio.supabase.co/functions/v1`

**Authentication**: Most endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Appointments](#appointments)
2. [Insurance & Eligibility](#insurance--eligibility)
3. [AI Services](#ai-services)
4. [Calendar Management](#calendar-management)
5. [Care Plans](#care-plans)
6. [Remote Patient Monitoring (RPM)](#remote-patient-monitoring-rpm)
7. [Prescriptions & Lab Orders](#prescriptions--lab-orders)
8. [Reviews & Moderation](#reviews--moderation)
9. [Notifications](#notifications)
10. [Legal & Compliance](#legal--compliance)

---

## Appointments

### Book Appointment (Atomic)

Books an appointment with slot holding and atomic transaction guarantees.

**Endpoint**: `POST /book-appointment-atomic`

**Authentication**: Required

**Request Body**:
```json
{
  "patient_id": "uuid",
  "specialist_id": "uuid",
  "scheduled_at": "2025-10-15T14:00:00Z",
  "consultation_type": "video",
  "chief_complaint": "Chest pain",
  "duration_minutes": 30,
  "hold_id": "uuid (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "appointment_id": "uuid",
  "scheduled_at": "2025-10-15T14:00:00Z",
  "video_room_url": "https://...",
  "confirmation_required": true
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `409`: Slot unavailable
- `422`: Compliance check failed

---

### Find Available Slots

Searches for available appointment slots based on criteria.

**Endpoint**: `POST /find-available-slots`

**Authentication**: Required

**Request Body**:
```json
{
  "specialist_id": "uuid",
  "start_date": "2025-10-15",
  "end_date": "2025-10-22",
  "duration_minutes": 30,
  "preferred_times": ["morning", "afternoon"]
}
```

**Response**:
```json
{
  "success": true,
  "slots": [
    {
      "start_time": "2025-10-15T09:00:00Z",
      "end_time": "2025-10-15T09:30:00Z",
      "available": true,
      "specialist_id": "uuid"
    }
  ],
  "total_available": 45
}
```

---

### Hold Booking Slot

Temporarily reserves a slot for 10 minutes.

**Endpoint**: `POST /book-with-hold`

**Authentication**: Required

**Request Body**:
```json
{
  "specialist_id": "uuid",
  "scheduled_at": "2025-10-15T14:00:00Z",
  "patient_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "hold_id": "uuid",
  "expires_at": "2025-10-15T14:10:00Z",
  "slot_reserved": true
}
```

---

## Insurance & Eligibility

### Check Insurance Eligibility

Verifies insurance eligibility and caches results for 24 hours.

**Endpoint**: `POST /check-insurance-eligibility`

**Authentication**: Required

**Request Body**:
```json
{
  "payer_id": "12345",
  "member_id": "ABC123456",
  "service_code": "99213"
}
```

**Response**:
```json
{
  "success": true,
  "is_eligible": true,
  "coverage_details": {
    "copay": 25,
    "deductible_remaining": 500,
    "coverage_percentage": 80
  },
  "coverage_end_date": "2025-12-31",
  "source": "cache"
}
```

---

### Verify Insurance Before Booking

Pre-booking insurance verification with cost estimation.

**Endpoint**: `POST /verify-insurance-before-booking`

**Authentication**: Required

**Request Body**:
```json
{
  "specialist_id": "uuid",
  "appointment_type": "consultation",
  "estimated_cost": 150
}
```

**Response**:
```json
{
  "verified": true,
  "requires_action": false,
  "estimated_out_of_pocket": 45,
  "insurance_details": {
    "copay": 25,
    "coinsurance": 20
  }
}
```

---

## AI Services

### AI Chatbot

Conversational AI assistant for support and guidance.

**Endpoint**: `POST /ai-chatbot`

**Authentication**: Required

**Request Body**:
```json
{
  "message": "What are the symptoms of flu?",
  "session_id": "uuid (optional)",
  "context": {}
}
```

**Response**:
```json
{
  "success": true,
  "response": "Common flu symptoms include...",
  "session_id": "uuid",
  "followup_questions": [
    "Do you have a fever?",
    "How long have you had symptoms?"
  ]
}
```

---

### AI Symptom Checker

AI-powered symptom analysis and triage.

**Endpoint**: `POST /ai-symptom-checker`

**Authentication**: Required

**Request Body**:
```json
{
  "symptoms": ["fever", "cough", "fatigue"],
  "duration_days": 3,
  "severity": "moderate",
  "patient_history": {}
}
```

**Response**:
```json
{
  "success": true,
  "triage_level": "urgent",
  "possible_conditions": [
    {
      "condition": "Influenza",
      "probability": 0.75,
      "specialty_recommended": "Internal Medicine"
    }
  ],
  "recommendations": [
    "Seek medical attention within 24 hours",
    "Monitor temperature"
  ]
}
```

---

### Extract SOAP Billing Codes

Extracts CPT and ICD-10 codes from SOAP notes using AI.

**Endpoint**: `POST /extract-soap-billing-codes`

**Authentication**: Required

**Request Body**:
```json
{
  "soap_note_id": "uuid",
  "subjective": "Patient complains of...",
  "objective": "Vitals: BP 120/80...",
  "assessment": "Diagnosis: Hypertension",
  "plan": "Prescribe lisinopril..."
}
```

**Response**:
```json
{
  "success": true,
  "cpt_codes": [
    {
      "code": "99213",
      "description": "Office visit",
      "confidence": 0.95
    }
  ],
  "icd10_codes": [
    {
      "code": "I10",
      "description": "Essential hypertension",
      "confidence": 0.92
    }
  ]
}
```

---

## Calendar Management

### Sync Calendar (Bidirectional)

Syncs appointments with external calendars (Google, Outlook).

**Endpoint**: `POST /calendar-sync-bidirectional`

**Authentication**: Required

**Request Body**:
```json
{
  "provider_id": "uuid",
  "sync_direction": "both",
  "conflict_resolution": "platform_wins"
}
```

**Response**:
```json
{
  "success": true,
  "synced_count": 12,
  "conflicts_resolved": 2,
  "last_sync": "2025-10-15T14:30:00Z"
}
```

---

### Calendar Token Refresh

Automatically refreshes OAuth tokens with retry logic.

**Endpoint**: `POST /calendar-token-refresh`

**Authentication**: Required

**Request Body**:
```json
{
  "provider_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "token_refreshed": true,
  "expires_at": "2025-10-15T15:30:00Z"
}
```

---

## Care Plans

### Care Plan Task Automation

Automates care plan task management, reminders, and completion tracking.

**Endpoint**: `POST /care-plan-task-automation`

**Authentication**: Required

**Request Body**:
```json
{
  "care_plan_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "care_plan_id": "uuid",
  "progress": 65,
  "total_tasks": 20,
  "completed_tasks": 13,
  "automated_actions": [
    {
      "task_id": "uuid",
      "action": "auto_completed",
      "task_name": "Follow-up questionnaire"
    },
    {
      "task_id": "uuid",
      "action": "reminder_sent",
      "task_name": "Medication refill"
    }
  ]
}
```

**Features**:
- Auto-completes overdue automated tasks
- Sends reminders 24 hours before due date
- Unlocks dependent tasks after milestone completion
- Updates care plan progress percentage

---

## Remote Patient Monitoring (RPM)

### RPM Device Alert Router

Routes device alerts to appropriate care team members with severity-based escalation.

**Endpoint**: `POST /rpm-device-alert-router`

**Authentication**: Required

**Request Body**:
```json
{
  "device_id": "uuid",
  "patient_id": "uuid",
  "metric_type": "blood_pressure",
  "value": 180,
  "threshold_config": {
    "critical_high": 180,
    "high": 160,
    "warning_high": 140,
    "warning_low": 90,
    "low": 80,
    "critical_low": 70
  }
}
```

**Response**:
```json
{
  "success": true,
  "alert_id": "uuid",
  "severity": "critical",
  "action_required": true,
  "recipients_notified": 3
}
```

**Alert Severity Levels**:
- **Critical**: Immediate notification via SMS, email, push, in-app. Auto-escalates after 15 minutes.
- **High**: Email, push, in-app notification. Requires action.
- **Medium**: Push and in-app notification. Informational.
- **Low**: In-app notification only.

**Routing Logic**:
- Primary specialist always notified
- Care team members notified for critical alerts
- Patient receives appropriate notification based on severity

---

## Prescriptions & Lab Orders

### Submit Prescription

Creates and routes electronic prescriptions to pharmacy.

**Endpoint**: `POST /route-prescription-to-pharmacy`

**Authentication**: Required

**Request Body**:
```json
{
  "patient_id": "uuid",
  "specialist_id": "uuid",
  "medication": "Lisinopril",
  "dosage": "10mg",
  "frequency": "once daily",
  "quantity": 30,
  "refills": 2,
  "pharmacy_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "prescription_id": "uuid",
  "routed_to": "CVS Pharmacy #12345",
  "estimated_ready": "2025-10-15T16:00:00Z"
}
```

---

### Submit Lab Order

Creates and submits lab orders to testing facilities.

**Endpoint**: `POST /submit-lab-order`

**Authentication**: Required

**Request Body**:
```json
{
  "patient_id": "uuid",
  "specialist_id": "uuid",
  "tests": ["CBC", "CMP", "HbA1c"],
  "priority": "routine",
  "lab_facility_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "order_id": "uuid",
  "order_number": "LAB-123456",
  "lab_facility": "Quest Diagnostics",
  "estimated_results": "2025-10-17"
}
```

---

## Reviews & Moderation

### Moderate Review (AI)

AI-powered review moderation for inappropriate content.

**Endpoint**: `POST /moderate-review-ai`

**Authentication**: Required

**Request Body**:
```json
{
  "review_id": "uuid",
  "review_text": "This doctor was amazing!",
  "rating": 5
}
```

**Response**:
```json
{
  "success": true,
  "moderation_result": "approved",
  "confidence": 0.95,
  "flags": [],
  "requires_human_review": false
}
```

**Moderation Flags**:
- `profanity`: Contains inappropriate language
- `personal_info`: Contains PHI or PII
- `spam`: Promotional or spam content
- `bias`: Potentially discriminatory content

---

## Notifications

### Send Multi-Channel Notification

Sends notifications across multiple channels (email, SMS, push, in-app).

**Endpoint**: `POST /send-multi-channel-notification`

**Authentication**: Required

**Request Body**:
```json
{
  "user_id": "uuid",
  "title": "Appointment Reminder",
  "message": "Your appointment is tomorrow at 2 PM",
  "channels": ["email", "sms", "push", "in_app"],
  "data": {
    "appointment_id": "uuid"
  }
}
```

**Response**:
```json
{
  "success": true,
  "sent_via": ["email", "sms", "push", "in_app"],
  "failed": [],
  "notification_id": "uuid"
}
```

**Available Channels**:
- `email`: Via Resend API
- `sms`: Via Twilio
- `push`: Push notifications
- `in_app`: In-app notification center
- `whatsapp`: Via WhatsApp Business API

---

## Legal & Compliance

### Legal Archive Compliance Check

Automated compliance verification for archived legal documents.

**Endpoint**: `POST /legal-archive-compliance-check`

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "archive_id": "uuid",
  "jurisdiction": "US"
}
```

**Response**:
```json
{
  "success": true,
  "archive_id": "uuid",
  "compliance_score": 85,
  "compliance_status": "warning",
  "issues": [
    {
      "severity": "medium",
      "issue": "Retention period expiring in 45 days",
      "recommendation": "Schedule review before expiration"
    }
  ],
  "days_remaining": 45
}
```

**Compliance Checks**:
- **HIPAA** (US): PHI encryption, access controls, audit trails
- **GDPR** (EU): Lawful basis, data subject rights, right to erasure
- **Retention periods**: Tracks document lifecycle
- **Access controls**: Role-based permissions verification
- **Audit trails**: Comprehensive activity logging

**Compliance Score**:
- `90-100`: Compliant ✅
- `70-89`: Warning ⚠️
- `50-69`: Non-compliant ❌
- `0-49`: Critical non-compliant 🚨

---

## Error Handling

All endpoints use consistent error responses:

```json
{
  "error": "Error message",
  "success": false,
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Status Codes**:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

---

## Rate Limiting

- Default: 100 requests/minute per user
- Burst: 20 requests/second
- Headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Webhooks

Subscribe to real-time events:

```json
{
  "event": "appointment.booked",
  "timestamp": "2025-10-15T14:30:00Z",
  "data": {
    "appointment_id": "uuid",
    "patient_id": "uuid",
    "specialist_id": "uuid"
  }
}
```

**Available Events**:
- `appointment.booked`
- `appointment.cancelled`
- `appointment.completed`
- `prescription.created`
- `lab_order.results_ready`
- `rpm.alert_critical`
- `review.submitted`

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Book appointment
const { data, error } = await supabase.functions.invoke('book-appointment-atomic', {
  body: {
    patient_id: 'uuid',
    specialist_id: 'uuid',
    scheduled_at: '2025-10-15T14:00:00Z',
    consultation_type: 'video'
  }
});
```

---

## Support

- **Documentation**: https://docs.lovable.dev
- **Email**: support@lovable.dev
- **Discord**: https://discord.gg/lovable

---

**Last Updated**: 2025-10-15  
**API Version**: 1.0.0
